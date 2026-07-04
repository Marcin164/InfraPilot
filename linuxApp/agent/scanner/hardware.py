"""Hardware section -- matches CPU/RAM/MOBO/Disks/GPU/BIOS.tsx.

Sourced from ``/proc``/``/sys`` (always present, no extra tooling) plus
``lsblk``/``lspci``/``dmidecode`` where sysfs alone doesn't expose a
field (RAM module part numbers, GPU identity, SMBIOS version) --
``dmidecode`` in particular needs root (fine, this agent runs as root
under systemd) and simply isn't installed on some minimal/container
images, so every call to it is wrapped in ``safe``/``try_cmd`` and
degrades to ``None``/an empty list rather than raising.
"""

from __future__ import annotations

import json
import platform
import re
import shutil
from pathlib import Path
from typing import Any

import psutil

from .helpers import as_list, read_dmi, read_text, safe, try_cmd


_ARCH_CODES = {
    "x86_64": 9, "amd64": 9,
    "aarch64": 12, "arm64": 12,
    "armv7l": 5, "armv6l": 5,
    "i686": 0, "i386": 0,
    "ppc64le": 3, "ppc64": 3,
    "ia64": 6,
}


def _collect_baseboard() -> dict[str, Any]:
    return {
        "serial_number": read_dmi("board_serial"),
        "manufacturer": read_dmi("board_vendor"),
        "product": read_dmi("board_name"),
        "hosting_board": None,
        "version": read_dmi("board_version"),
    }


def _cpu_model_name() -> str | None:
    cpuinfo = read_text("/proc/cpuinfo") or ""
    m = re.search(r"^model name\s*:\s*(.+)$", cpuinfo, re.MULTILINE)
    if m:
        return m.group(1).strip()
    # aarch64 /proc/cpuinfo has no "model name" -- fall back to the SoC's
    # DMI product/board name, the closest thing to a CPU label available.
    return read_dmi("product_name")


def _cpu_mhz_current() -> int | None:
    cpuinfo = read_text("/proc/cpuinfo") or ""
    m = re.search(r"^cpu MHz\s*:\s*([\d.]+)$", cpuinfo, re.MULTILINE)
    if not m:
        return None
    try:
        return round(float(m.group(1)))
    except ValueError:
        return None


def _cpu_mhz_max() -> int | None:
    for path in (
        "/sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq",
        "/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq",
    ):
        raw = read_text(path)
        if raw:
            try:
                return int(raw.strip()) // 1000
            except ValueError:
                continue
    return None


def _parse_sysfs_size(value: str) -> int | None:
    m = re.match(r"(\d+)\s*([KMG]?)", value.strip().upper())
    if not m:
        return None
    amount = int(m.group(1))
    multiplier = {"": 1, "K": 1024, "M": 1024 ** 2, "G": 1024 ** 3}.get(m.group(2), 1024)
    return amount * multiplier


def _cache_sizes() -> dict[int, int]:
    sizes: dict[int, int] = {}
    cache_root = Path("/sys/devices/system/cpu/cpu0/cache")
    if not cache_root.is_dir():
        return sizes
    for entry in sorted(cache_root.glob("index*")):
        level_raw = read_text(str(entry / "level"))
        size_raw = read_text(str(entry / "size"))
        if not level_raw or not size_raw:
            continue
        try:
            level = int(level_raw.strip())
        except ValueError:
            continue
        size_bytes = _parse_sysfs_size(size_raw)
        if size_bytes is None:
            continue
        sizes[level] = max(sizes.get(level, 0), size_bytes)
    return sizes


def _collect_cpu() -> list[dict[str, Any]]:
    arch_name = platform.machine()
    caches = safe(_cache_sizes, {})
    clock_current = safe(_cpu_mhz_current, None)
    clock_max = safe(_cpu_mhz_max, None) or clock_current
    return [{
        "name": safe(_cpu_model_name, None),
        "processor_id": None,
        "cores": psutil.cpu_count(logical=False),
        "threads": psutil.cpu_count(logical=True),
        "architecture": _ARCH_CODES.get(arch_name.lower()),
        "l2_cache": caches.get(2),
        "l3_cache": caches.get(3),
        "socket": None,
        "current_clock_speed": clock_current,
        "max_clock_speed": clock_max,
    }]


def _dmidecode_memory_devices() -> list[dict[str, Any]]:
    """Parse `dmidecode -t memory` "Memory Device" blocks. Root-only and
    not installed on every distro (containers, minimal cloud images) --
    callers fall back to a synthesized single module, same spirit as the
    macOS agent's Apple Silicon "Unified Memory" fallback.
    """
    out = try_cmd(["dmidecode", "-t", "memory"])
    if not out:
        return []
    devices: list[dict[str, Any]] = []
    current: dict[str, str] = {}
    in_device = False
    for line in out.splitlines():
        if line.startswith("Memory Device"):
            if in_device:
                devices.append(current)
            current, in_device = {}, True
            continue
        if not in_device or ":" not in line:
            continue
        key, _, value = line.strip().partition(":")
        current[key.strip()] = value.strip()
    if in_device and current:
        devices.append(current)
    return [d for d in devices if d.get("Size") and d["Size"].lower() != "no module installed"]


def _collect_ram() -> list[dict[str, Any]]:
    devices = safe(_dmidecode_memory_devices, [])
    if not devices:
        return [{
            "manufacturer": None,
            "part_number": None,
            "serial_number": None,
            "speed": None,
            "capacity": str(psutil.virtual_memory().total),
            "bank_label": "System Memory",
            "device_locator": None,
        }]
    out = []
    for dev in devices:
        size_match = re.match(r"([\d.]+)\s*(\w+)", dev.get("Size", ""))
        capacity_bytes = None
        if size_match:
            amount, unit = float(size_match.group(1)), size_match.group(2).upper()
            multiplier = {"GB": 1024 ** 3, "MB": 1024 ** 2, "KB": 1024}.get(unit, 1024 ** 2)
            capacity_bytes = int(amount * multiplier)
        speed_match = re.match(r"(\d+)", dev.get("Speed", ""))
        out.append({
            "manufacturer": dev.get("Manufacturer"),
            "part_number": dev.get("Part Number"),
            "serial_number": dev.get("Serial Number"),
            "speed": int(speed_match.group(1)) if speed_match else None,
            "capacity": str(capacity_bytes) if capacity_bytes else "",
            "bank_label": dev.get("Bank Locator"),
            "device_locator": dev.get("Locator"),
        })
    return out


def _lspci_display_devices() -> list[dict[str, str]]:
    out = try_cmd(["lspci", "-mm"])
    devices: list[dict[str, str]] = []
    for line in out.splitlines():
        if not re.search(r'"(VGA compatible controller|3D controller|Display controller)"', line):
            continue
        fields = re.findall(r'"((?:[^"\\]|\\.)*)"|(\S+)', line)
        values = [a or b for a, b in fields]
        if len(values) >= 4:
            devices.append({"class": values[1], "vendor": values[2], "device": values[3]})
    return devices


def _gpu_vram_bytes(index: int) -> int | None:
    # Best-effort positional match against /sys/class/drm/card* -- only
    # meaningful when the card enumeration order happens to line up with
    # lspci's, which isn't guaranteed. amdgpu is the only common driver
    # exposing VRAM size at all via sysfs; Intel/Nvidia report None here.
    cards = sorted(Path("/sys/class/drm").glob("card*/device/mem_info_vram_total"))
    if index >= len(cards):
        return None
    raw = read_text(str(cards[index]))
    if not raw:
        return None
    try:
        return int(raw.strip())
    except ValueError:
        return None


def _current_resolution() -> str | None:
    out = try_cmd(["xrandr", "--current"])
    m = re.search(r"connected\D*(\d+)x(\d+)\+\d+\+\d+", out)
    return f"{m.group(1)}x{m.group(2)}" if m else None


def _collect_gpus() -> list[dict[str, Any]]:
    devices = safe(_lspci_display_devices, [])
    resolution = safe(_current_resolution, None)
    out = []
    for i, dev in enumerate(devices):
        out.append({
            "name": f"{dev['vendor']} {dev['device']}".strip(),
            "adapter_ram": safe(_gpu_vram_bytes, None, i) or 0,
            "max_refresh_rate": None,
            "current_resolution": resolution if i == 0 else None,
            "video_processor": dev.get("device"),
            "driver_version": None,
        })
    return out


def _bios_smbios_version() -> tuple[int | None, int | None]:
    out = try_cmd(["dmidecode", "-t", "bios"])
    m = re.search(r"SMBIOS\s+(\d+)\.(\d+)", out)
    return (int(m.group(1)), int(m.group(2))) if m else (None, None)


def _collect_bios() -> dict[str, Any]:
    smbios_major, smbios_minor = safe(_bios_smbios_version, (None, None))
    return {
        "manufacturer": read_dmi("bios_vendor"),
        "serial_number": read_dmi("product_serial"),
        "smbios_major": smbios_major,
        "smbios_minor": smbios_minor,
        "version": read_dmi("bios_version"),
    }


def _lsblk_devices() -> list[dict[str, Any]]:
    out = try_cmd(["lsblk", "-J", "-b", "-o", "NAME,MODEL,SERIAL,SIZE,TYPE,FSTYPE,MOUNTPOINT"])
    if not out:
        return []
    try:
        data = json.loads(out)
    except json.JSONDecodeError:
        return []
    return data.get("blockdevices") or []


def _collect_disks() -> list[dict[str, Any]]:
    disks: list[dict[str, Any]] = []
    for dev in safe(_lsblk_devices, []):
        if dev.get("type") != "disk":
            continue
        partitions = []
        for child in dev.get("children") or []:
            mountpoint = child.get("mountpoint")
            total = int(child.get("size") or 0)
            free = 0
            used = total
            if mountpoint:
                usage = safe(lambda p=mountpoint: shutil.disk_usage(p), None)
                if usage:
                    free = usage.free
                    used = max(total - free, 0)
            partitions.append({
                "device_id": f"/dev/{child.get('name', '')}",
                "file_system": child.get("fstype"),
                "free_space": free,
                "total_size": total,
                "used_space": used,
                "volume_name": mountpoint or child.get("name"),
            })
        disks.append({
            "model": dev.get("model") or "Unknown",
            "serial_number": dev.get("serial"),
            "partitions": partitions,
        })
    return disks


def collect_hardware() -> dict[str, Any]:
    return {
        "baseboard":   safe(_collect_baseboard, {}),
        "cpu":         as_list(safe(_collect_cpu, [])),
        "ram_modules": as_list(safe(_collect_ram, [])),
        "gpus":        as_list(safe(_collect_gpus, [])),
        "bios":        safe(_collect_bios, {}),
        "disks":       as_list(safe(_collect_disks, [])),
    }
