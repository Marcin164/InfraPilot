"""Software section -- matches Software/Appx/Features tables.

``appx_packages`` and ``windows_features`` are UWP-packaging and Windows
Optional Features concepts with no macOS analogue at all -- they come
back empty so the corresponding tabs just show "0 items" rather than
fabricated data. ``installed_programs`` is real, sourced from
``system_profiler SPApplicationsDataType``.
"""

from __future__ import annotations

from typing import Any

from .helpers import as_list, run_system_profiler, safe


def _collect_installed_programs() -> list[dict[str, Any]]:
    data = run_system_profiler(["SPApplicationsDataType"])
    apps = data.get("SPApplicationsDataType") or []
    return [{
        "DisplayName": app.get("_name"),
        "DisplayVersion": app.get("version"),
        "Publisher": app.get("obtained_from") or app.get("signed_by"),
        "EstimatedSize": None,
        "InstallDate": app.get("lastModified"),
    } for app in apps]


def collect_software() -> dict[str, Any]:
    return {
        "installed_programs": as_list(safe(_collect_installed_programs, [])),
        "appx_packages":      [],
        "windows_features":   [],
    }
