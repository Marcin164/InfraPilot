"""Event-log section -- matches Events.tsx.

Cap at 200 latest entries per log to keep payload bounded.
"""

from __future__ import annotations

from typing import Any

from .helpers import as_list, run_powershell, safe


_EVENT_TYPE_MAP = {
    "Error": 1, "Warning": 2, "Information": 4,
    "SuccessAudit": 8, "FailureAudit": 16,
    "Critical": 1, "LogAlways": 4, "Verbose": 4,
}


def _query(log_name: str, limit: int = 200) -> str:
    return (
        f"$log = '{log_name}';"
        "Get-WinEvent -LogName $log -MaxEvents " + str(limit) + " -ErrorAction SilentlyContinue |"
        " ForEach-Object {"
        "  [pscustomobject]@{"
        "    EventID = $_.Id; Category = $_.TaskDisplayName;"
        "    LevelName = \"$($_.LevelDisplayName)\";"
        "    SourceName = $_.ProviderName;"
        # Bug: computing the truncation length from $_.Message.Length (the
        # ORIGINAL string) but calling .Substring() on the whitespace-collapsed
        # string (always <= original length, often shorter -- real event
        # messages are full of newlines/indentation). Whenever the collapsed
        # string was shorter than min(400, original length), .Substring()
        # threw "Index and length must refer to a location within the
        # string" -- a single such event aborted the whole 200-event batch
        # for that log (outer wrapper runs with $ErrorActionPreference=Stop),
        # so the agent silently reported 0 events for entire logs that
        # Event Viewer shows plenty of entries for. Compute the length from
        # the already-collapsed string instead.
        "    Message = if ($_.Message) { $m = ($_.Message -replace '\\s+', ' '); $m.Substring(0, [Math]::Min(400, $m.Length)) } else { '' };"
        "    TimeGenerated = $_.TimeCreated.ToString('yyyy-MM-dd HH:mm:ss');"
        "  }"
        "}"
    )


def _normalise(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for r in rows:
        level = (r.get("LevelName") or "").replace(" ", "")
        r["EventType"] = _EVENT_TYPE_MAP.get(level, 4)
        r.pop("LevelName", None)
        out.append(r)
    return out


def collect_events() -> dict[str, Any]:
    return {
        "System":      _normalise(as_list(safe(run_powershell, [], _query("System"), timeout=90))),
        "Application": _normalise(as_list(safe(run_powershell, [], _query("Application"), timeout=90))),
        "Security":    _normalise(as_list(safe(run_powershell, [], _query("Security"), timeout=90))),
    }
