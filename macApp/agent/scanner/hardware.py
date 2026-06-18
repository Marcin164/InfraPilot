"""Hardware section -- matches CPU/RAM/MOBO/Disks/GPU/BIOS.tsx.

Sourced from a single batched ``system_profiler`` call (Hardware/Memory/
Displays/Storage datatypes) plus ``psutil``/``sysctl`` for CPU core counts
and cache sizes that ``system_profiler`` doesn't expose. Apple Silicon has
no per-DIMM memory (it's unified, soldered to the SoC) and no clock-speed
sysctl -- those fields come back ``None``/a single synthetic "module"
rather than guessing.
"""

from __future__ import annotations

from typing import Any

import psutil

from .helpers import as_list, run_cmd, run_system_profiler, safe


def _sysctl_int(name: str) -> int | None:
    out = safe(run_cmd, "", ["/usr/sbin/sysctl", "-n", name])
    try:
        return int(out.strip())
    except (ValueError, AttributeError):
        return None


def _collect_baseboard(hw: dict[str, Any]) -> dict[str, Any]:
    return {
        "serial_number": hw.get("serial_number"),
        "manufacturer": "Apple Inc.",
        "product": hw.get("machine_name") or hw.get("machine_model"),
        "hosting_board": None,
        "version": hw.get("machine_model"),
    }


def _collect_cpu(hw: dict[str, Any]) -> list[dict[str, Any]]:
    machine = safe(run_cmd, "", ["/usr/bin/uname", "-m"]).strip()
    architecture = 12 if machine == "arm64" else 9
    clock_hz = _sysctl_int("hw.cpufrequency") or _sysctl_int("hw.cpufrequency_max")
    return [{
        "name": hw.get("chip_type") or hw.get("cpu_type"),
        "processor_id": None,
        "cores": psutil.cpu_count(logical=False),
        "threads": psutil.cpu_count(logical=True),
        "architecture": architecture,
        "l2_cache": _sysctl_int("hw.l2cachesize"),
        "l3_cache": _sysctl_int("hw.l3cachesize"),
        "socket": None,
        "current_clock_speed": clock_hz // 1_000_000 if clock_hz else None,
        "max_clock_speed": clock_hz // 1_000_000 if clock_hz else None,
    }]


def _collect_ram(memory_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    modules = [m for m in memory_items if m.get("dimm_size") and m.get("dimm_size") != "empty"]
    if not modules:
        # Apple Silicon: memory is unified/soldered, no per-DIMM data --
        # synthesize a single module so the RAM card still shows total size.
        return [{
            "manufacturer": "Apple",
            "part_number": "Unified Memory",
            "serial_number": None,
            "speed": None,
            "capacity": str(psutil.virtual_memory().total),
            "bank_label": "On-Package",
            "device_locator": "SoC",
        }]
    out = []
    for m in modules:
        out.append({
            "manufacturer": m.get("dimm_manufacturer"),
            "part_number": m.get("dimm_part_number"),
            "serial_number": m.get("dimm_serial_number"),
            "speed": m.get("dimm_speed"),
            "capacity": str(m.get("dimm_size_bytes") or ""),
            "bank_label": m.get("_name"),
            "device_locator": m.get("_name"),
        })
    return out


def _parse_vram_bytes(value: str | None) -> int:
    if not value:
        return 0
    parts = value.split()
    try:
        amount = float(parts[0])
    except (ValueError, IndexError):
        return 0
    unit = parts[1].upper() if len(parts) > 1 else "MB"
    multiplier = {"KB": 1024, "MB": 1024 ** 2, "GB": 1024 ** 3}.get(unit, 1024 ** 2)
    return int(amount * multiplier)


def _collect_gpus(display_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for gpu in display_items:
        ndrvs = gpu.get("spdisplays_ndrvs") or []
        primary = ndrvs[0] if ndrvs else {}
        out.append({
            "name": gpu.get("_name"),
            "adapter_ram": _parse_vram_bytes(gpu.get("spdisplays_vram") or gpu.get("spdisplays_vram_shared")),
            "max_refresh_rate": primary.get("_spdisplays_refresh_rate"),
            "current_resolution": primary.get("_spdisplays_resolution"),
            "video_processor": gpu.get("spdisplays_device_id") or gpu.get("_name"),
            "driver_version": None,
        })
    return out


def _collect_bios(hw: dict[str, Any]) -> dict[str, Any]:
    return {
        "manufacturer": "Apple Inc.",
        "serial_number": hw.get("serial_number"),
        "smbios_major": None,
        "smbios_minor": None,
        "version": hw.get("boot_rom_version"),
    }


def _collect_disks(storage_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    disks: dict[str, dict[str, Any]] = {}
    for vol in storage_items:
        drive = vol.get("physical_drive") or {}
        model = drive.get("device_name") or "Unknown"
        disk = disks.setdefault(model, {"model": model, "serial_number": None, "partitions": []})
        total = vol.get("size_in_bytes") or 0
        free = vol.get("free_space_in_bytes") or 0
        disk["partitions"].append({
            "device_id": vol.get("bsd_name"),
            "file_system": vol.get("file_system"),
            "free_space": free,
            "total_size": total,
            "used_space": max(total - free, 0),
            "volume_name": vol.get("_name"),
        })
    return list(disks.values())


def collect_hardware() -> dict[str, Any]:
    data = safe(
        run_system_profiler, {},
        ["SPHardwareDataType", "SPMemoryDataType", "SPDisplaysDataType", "SPStorageDataType"],
    )
    hw_items = data.get("SPHardwareDataType") or []
    hw = hw_items[0] if hw_items else {}

    return {
        "baseboard":   _collect_baseboard(hw),
        "cpu":         _collect_cpu(hw),
        "ram_modules": as_list(_collect_ram(data.get("SPMemoryDataType") or [])),
        "gpus":        as_list(_collect_gpus(data.get("SPDisplaysDataType") or [])),
        "bios":        _collect_bios(hw),
        "disks":       as_list(_collect_disks(data.get("SPStorageDataType") or [])),
    }
