"""Software section -- matches Software/Appx/Features tables.

``appx_packages`` and ``windows_features`` are UWP-packaging and Windows
Optional Features concepts with no Linux analogue at all -- they come
back empty so the corresponding tabs just show "0 items" rather than
fabricated data. ``installed_programs`` is sourced from whichever system
package manager is actually present (dpkg, then rpm, then pacman) --
most distros only ship one of these, so the first one that returns
anything wins.
"""

from __future__ import annotations

from typing import Any

from .helpers import as_list, safe, try_cmd


def _dpkg_programs() -> list[dict[str, Any]]:
    out = try_cmd([
        "dpkg-query", "-W",
        "--showformat=${Package}\t${Version}\t${Maintainer}\t${Installed-Size}\n",
    ])
    programs = []
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) != 4:
            continue
        name, version, maintainer, size_kb = parts
        try:
            size_bytes: int | None = int(size_kb) * 1024
        except ValueError:
            size_bytes = None
        programs.append({
            "DisplayName": name,
            "DisplayVersion": version,
            "Publisher": maintainer or None,
            "EstimatedSize": size_bytes,
            "InstallDate": None,
        })
    return programs


def _rpm_programs() -> list[dict[str, Any]]:
    out = try_cmd([
        "rpm", "-qa",
        "--queryformat", "%{NAME}\t%{VERSION}-%{RELEASE}\t%{VENDOR}\t%{SIZE}\t%{INSTALLTIME:date}\n",
    ])
    programs = []
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) != 5:
            continue
        name, version, vendor, size_bytes, install_date = parts
        try:
            size: int | None = int(size_bytes)
        except ValueError:
            size = None
        programs.append({
            "DisplayName": name,
            "DisplayVersion": version,
            "Publisher": None if vendor in ("(none)", "") else vendor,
            "EstimatedSize": size,
            "InstallDate": install_date or None,
        })
    return programs


def _pacman_programs() -> list[dict[str, Any]]:
    out = try_cmd(["pacman", "-Q"])
    programs = []
    for line in out.splitlines():
        name, _, version = line.partition(" ")
        if not name:
            continue
        programs.append({
            "DisplayName": name,
            "DisplayVersion": version or None,
            "Publisher": None,
            "EstimatedSize": None,
            "InstallDate": None,
        })
    return programs


def _collect_installed_programs() -> list[dict[str, Any]]:
    for collector in (_dpkg_programs, _rpm_programs, _pacman_programs):
        programs = safe(collector, [])
        if programs:
            return programs
    return []


def collect_software() -> dict[str, Any]:
    return {
        "installed_programs": as_list(safe(_collect_installed_programs, [])),
        "appx_packages":      [],
        "windows_features":   [],
    }
