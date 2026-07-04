"""Event-log section -- matches Events.tsx.

The systemd journal has no notion of separate System/Application/
Security "logs" the way Windows Event Log does -- it's one binary log,
filterable by field match. The three tabs are approximated with
``journalctl`` field matches that target roughly the same audience
(kernel messages, application/service messages, and auth-relevant
processes), each capped at 200 entries like the Windows agent caps
``Get-WinEvent -MaxEvents`` and the macOS agent caps its ``log show``
query.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from .helpers import as_list, run_cmd, safe


_LIMIT = 200

_PREDICATES: dict[str, list[str]] = {
    "System": ["-k"],
    "Application": ["_TRANSPORT=journal", "_TRANSPORT=stdout"],
    "Security": ["_COMM=sudo", "_COMM=sshd", "_COMM=polkitd", "_COMM=su", "+", "SYSLOG_FACILITY=10"],
}


def _query(match_args: list[str], limit: int) -> list[dict[str, Any]]:
    out = run_cmd(
        ["journalctl", "-o", "json", "--no-pager", "--since", "-6h", "-n", str(limit), *match_args],
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
        message = str(entry.get("MESSAGE", ""))[:400]
        try:
            priority = int(entry.get("PRIORITY"))
        except (TypeError, ValueError):
            priority = 6
        iso = None
        timestamp = entry.get("__REALTIME_TIMESTAMP")
        if timestamp:
            try:
                iso = datetime.fromtimestamp(int(timestamp) / 1_000_000, tz=timezone.utc).isoformat()
            except (ValueError, OverflowError, OSError):
                iso = None
        rows.append({
            "EventID": 0,
            "Category": entry.get("SYSLOG_IDENTIFIER") or entry.get("_TRANSPORT"),
            "EventType": 1 if priority <= 3 else 4,  # <=3: err/crit/alert/emerg
            "SourceName": entry.get("SYSLOG_IDENTIFIER") or entry.get("_COMM"),
            "Message": message,
            "TimeGenerated": iso,
        })
        if len(rows) >= limit:
            break
    return rows


def collect_events() -> dict[str, Any]:
    return {
        name: as_list(safe(_query, [], predicate, _LIMIT))
        for name, predicate in _PREDICATES.items()
    }
