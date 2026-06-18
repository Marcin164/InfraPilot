"""Event-log section -- matches Events.tsx.

macOS' Unified Logging has no notion of separate System/Application/
Security "logs" the way Windows Event Log does -- it's one stream,
filterable by predicate. The three tabs are approximated with predicates
that target roughly the same audience (kernel/system processes,
user-installed applications, and security-relevant daemons), each capped
at 200 entries like the Windows agent caps ``Get-WinEvent -MaxEvents``.
"""

from __future__ import annotations

import json
from typing import Any

from .helpers import as_list, run_cmd, safe


_LIMIT = 200

_PREDICATES = {
    "System": 'process == "kernel" OR senderImagePath CONTAINS "/System/"',
    "Application": 'processImagePath CONTAINS "/Applications/"',
    "Security": 'subsystem == "com.apple.securityd" OR process == "authd" OR process == "sandboxd"',
}

_LEVEL_TO_EVENT_TYPE = {
    "fault": 1, "error": 1,
    "default": 4, "info": 4, "debug": 4,
}


def _query(predicate: str, limit: int) -> list[dict[str, Any]]:
    out = run_cmd(
        [
            "/usr/bin/log", "show",
            "--style", "ndjson",
            "--last", "6h",
            "--predicate", predicate,
        ],
        timeout=90,
    )
    rows: list[dict[str, Any]] = []
    for line in out.splitlines():
        line = line.strip()
        if not line or not line.startswith("{"):
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        message = (entry.get("eventMessage") or "")[:400]
        level = (entry.get("messageType") or "default").lower()
        rows.append({
            "EventID": 0,
            "Category": entry.get("category") or entry.get("subsystem"),
            "EventType": _LEVEL_TO_EVENT_TYPE.get(level, 4),
            "SourceName": entry.get("processImagePath", "").rsplit("/", 1)[-1] or entry.get("subsystem"),
            "Message": message,
            "TimeGenerated": entry.get("timestamp"),
        })
        if len(rows) >= limit:
            break
    return rows


def collect_events() -> dict[str, Any]:
    return {
        name: as_list(safe(_query, [], predicate, _LIMIT))
        for name, predicate in _PREDICATES.items()
    }
