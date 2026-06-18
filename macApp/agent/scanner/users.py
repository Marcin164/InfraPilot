"""Local users / groups / profiles -- matches LocalUsers/Groups/Profiles tables.

Sourced from ``dscl`` (the local directory service CLI) instead of
``Get-CimInstance Win32_UserAccount``/``Win32_Group``. Filtered to
UniqueID/PrimaryGroupID >= 500 -- macOS reserves everything below that for
system/daemon accounts (``_spotlight``, ``_www``, ...), dozens of which
exist on every Mac and would otherwise drown out the handful of real
accounts an admin actually cares about.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from .helpers import as_list, run_cmd, safe


_REAL_ACCOUNT_MIN_ID = 500


def _dscl_read(path: str, key: str) -> str | None:
    out = safe(run_cmd, "", ["/usr/bin/dscl", ".", "-read", path, key])
    # Output looks like "UniqueID: 501" -- strip the "Key: " prefix.
    for line in out.splitlines():
        if line.startswith(f"{key}:"):
            return line.split(":", 1)[1].strip()
    return None


def _list_names(directory: str) -> list[str]:
    out = safe(run_cmd, "", ["/usr/bin/dscl", ".", "-list", directory])
    return [line.strip() for line in out.splitlines() if line.strip()]


def _collect_local_users() -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for name in _list_names("/Users"):
        uid_raw = _dscl_read(f"/Users/{name}", "UniqueID")
        try:
            uid = int(uid_raw) if uid_raw else -1
        except ValueError:
            uid = -1
        if uid < _REAL_ACCOUNT_MIN_ID:
            continue
        shell = _dscl_read(f"/Users/{name}", "UserShell") or ""
        out.append({
            "Name": name,
            "FullName": _dscl_read(f"/Users/{name}", "RealName"),
            "AccountType": 512,  # "Normal" -- macOS has no analogous enum
            "Disabled": shell.strip() == "/usr/bin/false",
            "Lockout": False,
            "PasswordChangeable": True,
            "PasswordExpires": False,  # macOS local accounts don't expire by default
            "PasswordRequired": True,
            "SID": _dscl_read(f"/Users/{name}", "GeneratedUID"),
            "Status": None,
        })
    return out


def _collect_local_groups() -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for name in _list_names("/Groups"):
        gid_raw = _dscl_read(f"/Groups/{name}", "PrimaryGroupID")
        try:
            gid = int(gid_raw) if gid_raw else -1
        except ValueError:
            gid = -1
        if gid < _REAL_ACCOUNT_MIN_ID and name not in ("admin", "staff", "wheel"):
            continue
        out.append({
            "Name": name,
            "Description": None,
            "Status": None,
            "SID": _dscl_read(f"/Groups/{name}", "GeneratedUID"),
        })
    return out


def _current_console_user() -> str:
    return safe(run_cmd, "", ["/usr/bin/stat", "-f%Su", "/dev/console"]).strip()


def _collect_user_profiles() -> list[dict[str, Any]]:
    console_user = safe(_current_console_user, "")
    out: list[dict[str, Any]] = []
    users_dir = Path("/Users")
    if not users_dir.is_dir():
        return out
    for entry in users_dir.iterdir():
        if not entry.is_dir() or entry.name in ("Shared", "Guest"):
            continue
        try:
            owner_uid = entry.stat().st_uid
        except OSError:
            continue
        if owner_uid < _REAL_ACCOUNT_MIN_ID:
            continue
        try:
            last_use = entry.stat().st_mtime
        except OSError:
            last_use = None
        out.append({
            "LocalPath": str(entry),
            "LastUseTime": None if last_use is None else
                __import__("datetime").datetime.fromtimestamp(last_use).strftime("%Y-%m-%d %H:%M:%S"),
            "HealthStatus": 1,  # Healthy
            "Loaded": entry.name == console_user,
            "Special": False,
            "SID": None,
            "Status": 0,  # OK
        })
    return out


def collect_users() -> dict[str, Any]:
    return {
        "local_users":    as_list(safe(_collect_local_users, [])),
        "local_groups":   as_list(safe(_collect_local_groups, [])),
        "users_profiles": as_list(safe(_collect_user_profiles, [])),
    }
