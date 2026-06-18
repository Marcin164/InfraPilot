"""Peripherals section -- matches Mice/Keyboards/Monitors/Sound/Printers/USB/ExtDrives.tsx.

macOS has no single "list of pointing devices" API the way
``Win32_PointingDevice`` is -- mice/keyboards are inferred from the
SPUSBDataType/SPBluetoothDataType device trees by name heuristics, plus a
synthetic built-in entry for laptops (internal keyboard/trackpad never
show up as USB/Bluetooth devices).
"""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

from .helpers import as_list, run_system_profiler, safe


def _flatten_usb_tree(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """SPUSBDataType nests devices under hubs via ``_items`` -- flatten."""
    out: list[dict[str, Any]] = []
    for item in items:
        out.append(item)
        children = item.get("_items")
        if children:
            out.extend(_flatten_usb_tree(children))
    return out


def _is_laptop(hw: dict[str, Any]) -> bool:
    name = f"{hw.get('machine_name', '')} {hw.get('machine_model', '')}"
    return "macbook" in name.lower()


def _collect_mice(devices: list[dict[str, Any]], is_laptop: bool) -> list[dict[str, Any]]:
    out = []
    if is_laptop:
        out.append({
            "name": "Apple Internal Trackpad", "manufacturer": "Apple Inc.",
            "pointing_type": 10, "pnp_device_id": None, "status": "OK", "buttons": 1,
        })
    for dev in devices:
        name = (dev.get("_name") or "").lower()
        if "mouse" in name or "trackpad" in name:
            out.append({
                "name": dev.get("_name"), "manufacturer": dev.get("manufacturer"),
                "pointing_type": 9, "pnp_device_id": dev.get("serial_num"),
                "status": "OK", "buttons": None,
            })
    return out


def _collect_keyboards(devices: list[dict[str, Any]], is_laptop: bool) -> list[dict[str, Any]]:
    out = []
    if is_laptop:
        out.append({
            "name": "Apple Internal Keyboard", "manufacturer": "Apple Inc.",
            "function_keys": None, "pnp_device_id": None, "status": "OK", "layout": None,
        })
    for dev in devices:
        name = (dev.get("_name") or "").lower()
        if "keyboard" in name:
            out.append({
                "name": dev.get("_name"), "manufacturer": dev.get("manufacturer"),
                "function_keys": None, "pnp_device_id": dev.get("serial_num"),
                "status": "OK", "layout": None,
            })
    return out


def _collect_monitors(display_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for gpu in display_items:
        for ndrv in gpu.get("spdisplays_ndrvs") or []:
            width, height = None, None
            resolution = ndrv.get("_spdisplays_resolution") or ""
            parts = resolution.lower().split("x")
            if len(parts) == 2:
                try:
                    width, height = int(parts[0].strip()), int(parts[1].strip().split()[0])
                except ValueError:
                    pass
            out.append({
                "name": ndrv.get("_name"),
                "manufacturer": None,
                "screen_width": width,
                "screen_height": height,
                "pnp_device_id": None,
                "status": "OK",
            })
    return out


def _collect_sound_devices(audio_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for item in audio_items:
        for dev in item.get("_items") or []:
            out.append({
                "name": dev.get("_name"), "manufacturer": dev.get("coreaudio_device_manufacturer"),
                "pnp_device_id": None, "status": "OK",
            })
    return out


def _collect_printers(printer_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for p in printer_items:
        out.append({
            "name": p.get("_name"),
            "port": p.get("ppd_uri") or p.get("uri"),
            "pnp_device_id": None,
            "driver": p.get("ppd") or p.get("driver_name"),
            "work_offline": p.get("status", "").lower() != "idle" if p.get("status") else False,
            "default": False,
            "shared": p.get("shared") == "yes",
            "status": p.get("status"),
        })
    return out


def _collect_usb_devices(usb_items: list[dict[str, Any]]) -> list[str]:
    flat = _flatten_usb_tree(usb_items)
    names = {d.get("_name") for d in flat if d.get("_name")}
    return sorted(names)


def _collect_external_drives() -> list[dict[str, Any]]:
    out = []
    volumes = Path("/Volumes")
    if not volumes.is_dir():
        return out
    for entry in volumes.iterdir():
        if entry.name in ("Macintosh HD", "Macintosh HD - Data"):
            continue  # boot volume, not an "external drive"
        usage = safe(lambda p=entry: shutil.disk_usage(p), None)
        if usage is None:
            continue
        out.append({
            "DeviceID": str(entry),
            "VolumeName": entry.name,
            "FileSystem": None,
            "FreeSpace": usage.free,
            "Size": usage.total,
        })
    return out


def collect_peripherals() -> dict[str, Any]:
    data = safe(
        run_system_profiler, {},
        ["SPUSBDataType", "SPBluetoothDataType", "SPDisplaysDataType", "SPAudioDataType", "SPPrintersDataType"],
    )
    hw = safe(run_system_profiler, {}, ["SPHardwareDataType"]).get("SPHardwareDataType") or [{}]
    is_laptop = _is_laptop(hw[0])

    usb_items = data.get("SPUSBDataType") or []
    bt_items = data.get("SPBluetoothDataType") or []
    hid_devices = _flatten_usb_tree(usb_items)

    def _bt_devices() -> list[dict[str, Any]]:
        out = []
        for item in bt_items:
            for name, props in (item.get("device_title") or {}).items():
                out.append({**props, "_name": props.get("device_name") or name})
        return out

    bt_devices = safe(_bt_devices, [])

    return {
        "mice":            as_list(safe(_collect_mice, [], hid_devices + bt_devices, is_laptop)),
        "keyboards":       as_list(safe(_collect_keyboards, [], hid_devices + bt_devices, is_laptop)),
        "monitors":        as_list(safe(_collect_monitors, [], data.get("SPDisplaysDataType") or [])),
        "sound_devices":   as_list(safe(_collect_sound_devices, [], data.get("SPAudioDataType") or [])),
        "printers":        as_list(safe(_collect_printers, [], data.get("SPPrintersDataType") or [])),
        "usb_devices":     as_list(safe(_collect_usb_devices, [], usb_items)),
        "external_drives": as_list(safe(_collect_external_drives, [])),
    }
