"""Fast, local-only system facts for the GUI's Start tab.

Deliberately avoids agent/scanner/* -- those spawn PowerShell per section
and a full network collection alone can take up to a minute (see
scanner/network.py's per-adapter CIM queries), far too slow for a tab that
should render the moment an operator opens it.
"""

from __future__ import annotations

import getpass
import socket
import subprocess
from datetime import datetime, timezone
from typing import Any

import psutil


def _local_ip(family: socket.AddressFamily, probe: tuple[str, int]) -> str:
    """Local address the OS would pick to reach ``probe``. A UDP "connect"
    never sends a packet -- it only asks the kernel to resolve a route --
    so this works even offline and needs no elevated privileges."""
    sock = socket.socket(family, socket.SOCK_DGRAM)
    try:
        sock.connect(probe)
        return sock.getsockname()[0]
    except OSError:
        return ""
    finally:
        sock.close()


def _default_gateway_ipv4() -> str:
    """Parses ``route print -4`` for the 0.0.0.0/0 row's gateway column.
    Column layout is locale-stable (only headers are translated), so this
    avoids spawning PowerShell just for one field."""
    try:
        result = subprocess.run(
            ["route", "print", "-4"],
            capture_output=True, text=True, timeout=5,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except Exception:  # noqa: BLE001
        return ""
    for line in result.stdout.splitlines():
        parts = line.split()
        if len(parts) == 5 and parts[0] == "0.0.0.0" and parts[1] == "0.0.0.0":
            return parts[2]
    return ""


def collect_quick_facts() -> dict[str, Any]:
    """Returns display-ready strings for hostname/user/IPs/gateway, plus a
    raw ``uptime_seconds`` float -- uptime needs language-aware word forms
    (dzień/dni vs day/days), so formatting it lives in gui.py next to the
    i18n Translator instead of being baked in here."""
    try:
        username = getpass.getuser()
    except Exception:  # noqa: BLE001
        username = ""
    try:
        uptime_seconds = datetime.now(tz=timezone.utc).timestamp() - psutil.boot_time()
    except Exception:  # noqa: BLE001
        uptime_seconds = None

    return {
        "hostname": socket.gethostname() or "-",
        "username": username or "-",
        "ipv4": _local_ip(socket.AF_INET, ("8.8.8.8", 80)) or "-",
        "ipv6": _local_ip(socket.AF_INET6, ("2001:4860:4860::8888", 80)) or "-",
        "gateway": _default_gateway_ipv4() or "-",
        "uptime_seconds": uptime_seconds,
    }
