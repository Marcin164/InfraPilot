"""Shared helpers -- PowerShell invocation + safe defaults."""

from __future__ import annotations

import functools
import json
import logging
import os
import subprocess
from typing import Any


log = logging.getLogger(__name__)


@functools.lru_cache(maxsize=1)
def _powershell_exe() -> str:
    """Absolute path to powershell.exe, not the bare name.

    A bare "powershell.exe" relies on CreateProcess's PATH search, which
    silently came back empty (every PS-based collector returning its
    default `[]`/`{}`) under some non-interactive contexts (Task
    Scheduler/SYSTEM, or a stripped PATH in the frozen exe's environment)
    where %SystemRoot%\\System32 wasn't on PATH the way it is in an
    interactive session. Resolving the absolute path via %SystemRoot%
    sidesteps PATH entirely. Falls back to the bare name (then pwsh.exe)
    if that exact file isn't there, e.g. a Windows PowerShell-less image.
    """
    system_root = os.environ.get("SystemRoot", r"C:\Windows")
    candidate = os.path.join(
        system_root, "System32", "WindowsPowerShell", "v1.0", "powershell.exe",
    )
    if os.path.isfile(candidate):
        return candidate
    log.warning(
        "powershell.exe not found at %s -- falling back to PATH lookup", candidate,
    )
    return "powershell.exe"


def run_powershell(script: str, timeout: int = 90) -> Any:
    """Run a PowerShell script that emits JSON on stdout. Returns the
    parsed value, or raises on PS failure. Each scan section calls this
    multiple times -- wrapping minimises subprocess churn."""
    wrapped = (
        # Windows PowerShell 5.1 writes redirected stdout using the
        # system's OEM/ANSI codepage (e.g. cp852/cp1250 on a Polish
        # Windows install), not UTF-8 -- diacritics (ą, ć, ę, ł, ń, ó, ś,
        # ż, ź) from things like localized firewall rule names then come
        # out as invalid UTF-8 bytes, which Python's errors="replace"
        # below turns into "�". Forcing both encoding knobs to UTF-8
        # before producing output makes the bytes on the wire actually
        # match the "utf-8" decode on the Python side.
        "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;"
        "$OutputEncoding = [System.Text.Encoding]::UTF8;"
        "$ErrorActionPreference='Stop';"
        "try {"
        f"  $r = & {{ {script} }};"
        "  if ($null -eq $r) { '' } else {"
        "    $r | ConvertTo-Json -Depth 6 -Compress"
        "  }"
        "} catch { Write-Error $_; exit 1 }"
    )
    proc = subprocess.run(
        [
            _powershell_exe(),
            "-NoProfile", "-NonInteractive",
            "-ExecutionPolicy", "Bypass",
            "-OutputFormat", "Text",
            "-Command", wrapped,
        ],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        timeout=timeout,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"PowerShell failed (rc={proc.returncode}): "
            f"{(proc.stderr or '').strip()[:500]}"
        )
    out = (proc.stdout or "").strip()
    if not out:
        return None
    try:
        return json.loads(out)
    except json.JSONDecodeError as err:
        raise RuntimeError(f"PowerShell did not return JSON: {err}; first 200: {out[:200]}")


def as_list(value: Any) -> list[Any]:
    """ConvertTo-Json collapses single-element arrays. Use this whenever
    the consumer expects a list."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def safe(fn, default, *args, **kwargs):
    """Call ``fn`` and fall back to ``default`` on any error."""
    try:
        return fn(*args, **kwargs)
    except Exception as err:  # noqa: BLE001
        log.warning("collector %s failed: %s", getattr(fn, "__name__", fn), err)
        return default
