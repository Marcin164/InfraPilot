"""Stable hardware identifiers used by /devices/agent/enroll.

Same response shape backend's extractFingerprint()/enrollAgent() expect:
tpmFingerprint, macAddresses, cpuId, serialNumber, manufacturer, model,
deviceType, hostname, platform, agentVersion. Some Linux hardware has a
real discrete TPM, but there's no portable in-kernel API to read its
endorsement key without extra userspace tooling (``tpm2-tools``) that
isn't guaranteed installed, so ``tpmFingerprint`` is instead filled from
``/etc/machine-id`` (the same per-installation identifier systemd/D-Bus
already rely on), hashed the same way the Windows agent hashes its TPM
endorsement key and the macOS agent hashes its IOPlatformUUID -- it
plays the same "best single identifier" role in the backend's matching
logic. ``cpuId`` is only synthesized as a last-resort fallback, same as
macOS.
"""

from __future__ import annotations

import hashlib
import socket
import uuid
from pathlib import Path
from typing import Any

import psutil

from .scanner.helpers import read_dmi, safe


_MACHINE_ID_PATHS = (Path("/etc/machine-id"), Path("/var/lib/dbus/machine-id"))

# SMBIOS chassis-type codes (DMTF SMBIOS spec, Table "System Enclosure or
# Chassis Types") that correspond to a portable form factor.
_LAPTOP_CHASSIS_CODES = {"8", "9", "10", "14", "30", "31", "32"}


def _machine_id_fingerprint() -> str | None:
    for path in _MACHINE_ID_PATHS:
        try:
            value = path.read_text(encoding="utf-8").strip()
        except OSError:
            continue
        if value:
            return hashlib.sha256(value.encode("utf-8")).hexdigest()
    return None


def _mac_addresses() -> list[str]:
    seen: set[str] = set()
    for addrs in psutil.net_if_addrs().values():
        for a in addrs:
            v = (a.address or "").strip()
            if len(v) != 17:
                continue
            norm = v.upper().replace("-", ":")
            if norm in {"00:00:00:00:00:00", "FF:FF:FF:FF:FF:FF"}:
                continue
            if all(c in "0123456789ABCDEF:" for c in norm):
                seen.add(norm)
    return sorted(seen)


def _device_type() -> str:
    code = read_dmi("chassis_type")
    return "Laptop" if code in _LAPTOP_CHASSIS_CODES else "PC"


def collect_fingerprint(agent_version: str) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "hostname": socket.gethostname(),
        "platform": "linux",
        "agentVersion": agent_version,
    }
    if tpm := safe(_machine_id_fingerprint, None):
        payload["tpmFingerprint"] = tpm
    if macs := _mac_addresses():
        payload["macAddresses"] = macs
    if serial := (read_dmi("product_serial") or read_dmi("board_serial")):
        payload["serialNumber"] = serial
    if manufacturer := (read_dmi("sys_vendor") or read_dmi("board_vendor")):
        payload["manufacturer"] = manufacturer
    if model := (read_dmi("product_name") or read_dmi("board_name")):
        payload["model"] = model
    payload["deviceType"] = _device_type()

    if not any(k in payload for k in ("tpmFingerprint", "cpuId", "serialNumber", "macAddresses")):
        payload["cpuId"] = "fallback-" + str(uuid.uuid5(uuid.NAMESPACE_DNS, socket.gethostname()))
    return payload
