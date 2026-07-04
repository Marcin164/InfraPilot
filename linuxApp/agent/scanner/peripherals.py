"""Peripherals section -- matches Mice/Keyboards/Monitors/Sound/Printers/USB/ExtDrives.tsx.

Linux has no single "list of pointing devices" API the way
``Win32_PointingDevice`` is -- mice/keyboards are inferred from
``/proc/bus/input/devices`` by handler + name heuristics (the same kind
of best-effort classification the macOS agent does against its
USB/Bluetooth device trees).
"""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from typing import Any

from .helpers import as_list, read_text, safe, try_cmd


_KEYBOARD_NAME_EXCLUDE = re.compile(r"button|video bus|sleep|power|consumer control", re.IGNORECASE)


def _input_devices() -> list[dict[str, str]]:
    raw = read_text("/proc/bus/input/devices") or ""
    devices: list[dict[str, str]] = []
    current: dict[str, str] = {}
    for line in raw.splitlines():
        if not line.strip():
            if current:
                devices.append(current)
            current = {}
            continue
        if line.startswith("N: Name="):
            current["name"] = line.split("=", 1)[1].strip().strip('"')
        elif line.startswith("H: Handlers="):
            current["handlers"] = line.split("=", 1)[1].strip()
    if current:
        devices.append(current)
    return devices


def _collect_mice(devices: list[dict[str, str]]) -> list[dict[str, Any]]:
    out = []
    for dev in devices:
        if re.search(r"\bmouse\d*\b", dev.get("handlers", "")):
            out.append({
                "name": dev.get("name"), "manufacturer": None,
                "pointing_type": 9, "pnp_device_id": None, "status": "OK", "buttons": None,
            })
    return out


def _collect_keyboards(devices: list[dict[str, str]]) -> list[dict[str, Any]]:
    out = []
    for dev in devices:
        handlers = dev.get("handlers", "").split()
        name = dev.get("name") or ""
        if "kbd" not in handlers or _KEYBOARD_NAME_EXCLUDE.search(name):
            continue
        out.append({
            "name": name, "manufacturer": None,
            "function_keys": None, "pnp_device_id": None, "status": "OK", "layout": None,
        })
    return out


def _drm_connectors() -> list[dict[str, Any]]:
    out = []
    for status_path in sorted(Path("/sys/class/drm").glob("card*-*/status")):
        connector_dir = status_path.parent
        status = read_text(str(status_path)) or ""
        if status.strip() != "connected":
            continue
        modes = read_text(str(connector_dir / "modes")) or ""
        first_mode = modes.splitlines()[0].strip() if modes.strip() else ""
        width = height = None
        if "x" in first_mode:
            w, _, h = first_mode.partition("x")
            if w.isdigit() and h.isdigit():
                width, height = int(w), int(h)
        out.append({
            "name": connector_dir.name.split("-", 1)[-1],
            "manufacturer": None,
            "screen_width": width,
            "screen_height": height,
            "pnp_device_id": None,
            "status": "OK",
        })
    return out


def _sound_devices() -> list[dict[str, Any]]:
    raw = read_text("/proc/asound/cards") or ""
    out = []
    for line in raw.splitlines():
        m = re.match(r"\s*\d+\s+\[\S+\s*\]:\s*(.+)$", line)
        if m:
            out.append({"name": m.group(1).strip(), "manufacturer": None, "pnp_device_id": None, "status": "OK"})
    return out


def _default_printer() -> str | None:
    out = try_cmd(["lpstat", "-d"])
    m = re.search(r"system default destination:\s*(\S+)", out)
    return m.group(1) if m else None


def _printers() -> list[dict[str, Any]]:
    out = try_cmd(["lpstat", "-p"])
    default = safe(_default_printer, None)
    printers = []
    for line in out.splitlines():
        m = re.match(r"printer (\S+) is (\w+)", line)
        if not m:
            continue
        name, status = m.groups()
        printers.append({
            "name": name,
            "port": None,
            "pnp_device_id": None,
            "driver": None,
            "work_offline": status.lower() != "idle",
            "default": name == default,
            "shared": False,
            "status": status,
        })
    return printers


def _usb_devices() -> list[str]:
    out = try_cmd(["lsusb"])
    names: set[str] = set()
    for line in out.splitlines():
        m = re.match(r"Bus \d+ Device \d+: ID [0-9a-f]{4}:[0-9a-f]{4}\s*(.*)$", line)
        if m and m.group(1).strip():
            names.add(m.group(1).strip())
    return sorted(names)


def _external_drives() -> list[dict[str, Any]]:
    out = try_cmd(["lsblk", "-J", "-b", "-o", "NAME,RM,TYPE,FSTYPE,MOUNTPOINT,LABEL"])
    if not out:
        return []
    try:
        data = json.loads(out)
    except json.JSONDecodeError:
        return []

    drives = []

    def _walk(devices: list[dict[str, Any]]) -> None:
        for dev in devices:
            if dev.get("type") == "part" and dev.get("rm") in (True, "1", 1) and dev.get("mountpoint"):
                usage = safe(shutil.disk_usage, None, dev["mountpoint"])
                drives.append({
                    "DeviceID": f"/dev/{dev.get('name', '')}",
                    "VolumeName": dev.get("label") or dev.get("mountpoint"),
                    "FileSystem": dev.get("fstype"),
                    "FreeSpace": usage.free if usage else 0,
                    "Size": usage.total if usage else 0,
                })
            _walk(dev.get("children") or [])

    _walk(data.get("blockdevices") or [])
    return drives


def collect_peripherals() -> dict[str, Any]:
    devices = safe(_input_devices, [])

    return {
        "mice":            as_list(safe(_collect_mice, [], devices)),
        "keyboards":       as_list(safe(_collect_keyboards, [], devices)),
        "monitors":        as_list(safe(_drm_connectors, [])),
        "sound_devices":   as_list(safe(_sound_devices, [])),
        "printers":        as_list(safe(_printers, [])),
        "usb_devices":     as_list(safe(_usb_devices, [])),
        "external_drives": as_list(safe(_external_drives, [])),
    }
