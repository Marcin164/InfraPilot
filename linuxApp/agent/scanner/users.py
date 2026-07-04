"""Local users / groups / profiles -- matches LocalUsers/Groups/Profiles tables.

Sourced from ``/etc/passwd``/``/etc/group`` (via the stdlib ``pwd``/
``grp`` modules) instead of ``Get-CimInstance Win32_UserAccount``/
``Win32_Group``. Filtered to UID/GID >= 1000 -- the Debian/RHEL
convention for "first real user account", below which is system/
service accounts (``daemon``, ``www-data``, ...), dozens of which exist
on every Linux host and would otherwise drown out the handful of real
accounts an admin actually cares about.
"""

from __future__ import annotations

import datetime
import grp
import pwd
from pathlib import Path
from typing import Any

from .helpers import as_list, safe, try_cmd


_REAL_ACCOUNT_MIN_ID = 1000
_NOBODY_UID = 65534


def _account_locked(username: str) -> bool:
    # /etc/shadow is root-only (0640/0600) -- this agent runs as root via
    # systemd, but degrade to "unknown -> not locked" rather than raising
    # if permissions ever don't line up (e.g. run manually as a normal user).
    try:
        with open("/etc/shadow", encoding="utf-8") as f:
            for line in f:
                fields = line.split(":")
                if len(fields) > 1 and fields[0] == username:
                    return fields[1].startswith("!") or fields[1].startswith("*")
    except (OSError, PermissionError):
        pass
    return False


def _logged_in_users() -> set[str]:
    out = try_cmd(["who"])
    return {line.split()[0] for line in out.splitlines() if line.split()}


def _collect_local_users() -> list[dict[str, Any]]:
    out = []
    for entry in pwd.getpwall():
        if entry.pw_uid < _REAL_ACCOUNT_MIN_ID or entry.pw_uid == _NOBODY_UID:
            continue
        out.append({
            "Name": entry.pw_name,
            "FullName": (entry.pw_gecos or "").split(",")[0] or None,
            "AccountType": 512,  # "Normal" -- Linux has no analogous enum
            "Disabled": safe(_account_locked, False, entry.pw_name),
            "Lockout": False,
            "PasswordChangeable": True,
            "PasswordExpires": False,  # /etc/login.defs aging is per-policy, not queried here
            "PasswordRequired": True,
            "SID": str(entry.pw_uid),
            "Status": None,
        })
    return out


def _collect_local_groups() -> list[dict[str, Any]]:
    out = []
    for entry in grp.getgrall():
        if entry.gr_gid < _REAL_ACCOUNT_MIN_ID and entry.gr_name not in ("sudo", "wheel", "adm", "admin"):
            continue
        out.append({
            "Name": entry.gr_name,
            "Description": None,
            "Status": None,
            "SID": str(entry.gr_gid),
        })
    return out


def _collect_user_profiles() -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    home_root = Path("/home")
    if not home_root.is_dir():
        return out
    real_users = {
        e.pw_name: e for e in pwd.getpwall()
        if e.pw_uid >= _REAL_ACCOUNT_MIN_ID and e.pw_uid != _NOBODY_UID
    }
    logged_in = safe(_logged_in_users, set())
    for entry in home_root.iterdir():
        if not entry.is_dir() or entry.name not in real_users:
            continue
        try:
            mtime = entry.stat().st_mtime
        except OSError:
            mtime = None
        out.append({
            "LocalPath": str(entry),
            "LastUseTime": None if mtime is None
                else datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S"),
            "HealthStatus": 1,  # Healthy
            "Loaded": entry.name in logged_in,
            "Special": False,
            "SID": str(real_users[entry.name].pw_uid),
            "Status": 0,  # OK
        })
    return out


def collect_users() -> dict[str, Any]:
    return {
        "local_users":    as_list(safe(_collect_local_users, [])),
        "local_groups":   as_list(safe(_collect_local_groups, [])),
        "users_profiles": as_list(safe(_collect_user_profiles, [])),
    }
