"""System / OS section -- matches OS.tsx via SystemInfo.tsx.

Same top-level shape as the Windows/macOS agents (hostname, os_name,
os_version, username, boot_time, machine, Cim{...}) -- ``Cim`` keeps
that name even though there's no CIM/WMI on Linux, purely so
``OS.tsx`` (which reads ``systemInfo.Cim.Caption`` etc.) doesn't need a
platform branch. Distro name/version come from ``/etc/os-release``
(the freedesktop.org standard every major distro ships), not
``platform.system()``/``platform.release()`` alone -- those only ever
say "Linux" + a kernel version, which tells an admin nothing about
whether a fleet is running Ubuntu 22.04 or Debian 12.
"""

from __future__ import annotations

import getpass
import locale
import platform
import socket
from datetime import datetime, timezone
from typing import Any

import psutil

from .helpers import read_dmi, read_text, safe


def _os_release() -> dict[str, str]:
    raw = read_text("/etc/os-release") or ""
    out: dict[str, str] = {}
    for line in raw.splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        out[key.strip()] = value.strip().strip('"')
    return out


def _locale_parts() -> tuple[str | None, str | None]:
    try:
        lang_code, _ = locale.getlocale()
    except (ValueError, locale.Error):
        lang_code = None
    if not lang_code or "_" not in lang_code:
        return (lang_code, None)
    lang, _, country = lang_code.partition("_")
    return lang, country


def collect_system() -> dict[str, Any]:
    os_release = safe(_os_release, {})
    lang, country = safe(_locale_parts, (None, None))

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
        "os_version": platform.release(),
        "username": user,
        "boot_time": boot_iso,
        "machine": platform.machine(),
        "Cim": {
            "Caption": os_release.get("PRETTY_NAME") or f"Linux {platform.release()}",
            "Version": os_release.get("VERSION_ID"),
            "SerialNumber": read_dmi("product_serial"),
            "OSArchitecture": platform.machine(),
            "InstallDate": None,
            "LastBootUpTime": boot_iso,
            "BuildNumber": platform.release(),
            "OSLanguage": lang or None,
            "CountryCode": country or None,
        },
    }
