"""Stable hardware identifiers used by /devices/agent/enroll.

Same response shape backend's extractFingerprint()/enrollAgent() expect:
tpmFingerprint, macAddresses, cpuId, serialNumber, manufacturer, model,
deviceType, hostname, platform, agentVersion. macOS has no TPM, so
``tpmFingerprint`` is filled from the per-machine IOPlatformUUID
(``system_profiler SPHardwareDataType`` -> ``platform_UUID``) hashed the
same way the Windows agent hashes its TPM endorsement key -- it plays
the same "best single identifier" role in the backend's matching logic.
There is no exposed per-machine "processor id" on macOS, so ``cpuId`` is
omitted; MAC addresses + serial number are the tiebreakers.
"""

from __future__ import annotations

import hashlib
import socket
import uuid
from typing import Any

import psutil

from .scanner.helpers import run_system_profiler, safe


def _hardware_info() -> dict[str, Any]:
    data = run_system_profiler(["SPHardwareDataType"])
    items = data.get("SPHardwareDataType") or []
    return items[0] if items else {}


def _platform_uuid_fingerprint(hw: dict[str, Any]) -> str | None:
    uuid_value = hw.get("platform_UUID")
    if not isinstance(uuid_value, str) or not uuid_value.strip():
        return None
    return hashlib.sha256(uuid_value.strip().encode("utf-8")).hexdigest()


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


def _device_type(hw: dict[str, Any]) -> str:
    name = f"{hw.get('machine_name', '')} {hw.get('machine_model', '')}".strip()
    return "Laptop" if "macbook" in name.lower() else "PC"


def collect_fingerprint(agent_version: str) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "hostname": socket.gethostname(),
        "platform": "darwin",
        "agentVersion": agent_version,
    }
    hw = safe(_hardware_info, {})
    if tpm := _platform_uuid_fingerprint(hw):
        payload["tpmFingerprint"] = tpm
    if macs := _mac_addresses():
        payload["macAddresses"] = macs
    if hw.get("serial_number"):
        payload["serialNumber"] = hw["serial_number"]
    payload["manufacturer"] = "Apple Inc."
    if hw.get("machine_name") or hw.get("machine_model"):
        payload["model"] = hw.get("machine_name") or hw.get("machine_model")
    payload["deviceType"] = _device_type(hw)

    if not any(k in payload for k in ("tpmFingerprint", "cpuId", "serialNumber", "macAddresses")):
        payload["cpuId"] = "fallback-" + str(uuid.uuid5(uuid.NAMESPACE_DNS, socket.gethostname()))
    return payload
