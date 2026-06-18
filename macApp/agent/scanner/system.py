"""System / OS section -- matches OS.tsx via SystemInfo.tsx.

Same top-level shape as the Windows agent (hostname, os_name, os_version,
username, boot_time, machine, Cim{...}) -- ``Cim`` keeps that name even
though there's no CIM/WMI on macOS, purely so ``OS.tsx`` (which reads
``systemInfo.Cim.Caption`` etc.) doesn't need a platform branch.
"""

from __future__ import annotations

import getpass
import platform
import socket
from datetime import datetime, timezone
from typing import Any

import psutil

from .helpers import run_cmd, run_system_profiler, safe


def _sw_vers() -> dict[str, str]:
    out: dict[str, str] = {}
    for key, flag in (
        ("product_name", "-productName"),
        ("product_version", "-productVersion"),
        ("build_version", "-buildVersion"),
    ):
        out[key] = safe(run_cmd, "", ["/usr/bin/sw_vers", flag])
    return out


def _locale() -> tuple[str, str]:
    raw = safe(run_cmd, "", ["/usr/bin/defaults", "read", "-g", "AppleLocale"]).strip()
    if "_" in raw:
        lang, _, country = raw.partition("_")
        return lang, country
    return raw, ""


def collect_system() -> dict[str, Any]:
    sw = _sw_vers()
    hw_items = safe(run_system_profiler, {}, ["SPHardwareDataType"]).get("SPHardwareDataType") or []
    hw = hw_items[0] if hw_items else {}
    lang, country = _locale()

    try:
        boot_iso = datetime.fromtimestamp(psutil.boot_time(), tz=timezone.utc).isoformat()
    except Exception:  # noqa: BLE001
        boot_iso = ""
    try:
        user = getpass.getuser()
    except Exception:  # noqa: BLE001
        user = ""

    return {
        "hostname": socket.gethostname(),
        "os_name": platform.system(),
        "os_version": platform.version(),
        "username": user,
        "boot_time": boot_iso,
        "machine": platform.machine(),
        "Cim": {
            "Caption": f"{sw.get('product_name', 'macOS')} {sw.get('product_version', '')}".strip(),
            "Version": sw.get("product_version"),
            "SerialNumber": hw.get("serial_number"),
            "OSArchitecture": platform.machine(),
            "InstallDate": None,
            "LastBootUpTime": boot_iso,
            "BuildNumber": sw.get("build_version"),
            "OSLanguage": lang or None,
            "CountryCode": country or None,
        },
    }
