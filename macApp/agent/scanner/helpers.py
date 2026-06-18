"""Shared helpers -- shell invocation + system_profiler JSON + safe defaults."""

from __future__ import annotations

import json
import logging
import subprocess
from typing import Any


log = logging.getLogger(__name__)


def run_cmd(args: list[str], timeout: int = 60) -> str:
    """Run a command and return stripped stdout, or raise on non-zero exit."""
    proc = subprocess.run(
        args, capture_output=True, text=True, encoding="utf-8", errors="replace",
        timeout=timeout,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"{args[0]} failed (rc={proc.returncode}): "
            f"{(proc.stderr or '').strip()[:500]}"
        )
    return (proc.stdout or "").strip()


def run_system_profiler(datatypes: list[str], timeout: int = 90) -> dict[str, Any]:
    """Run ``system_profiler -json <datatypes...>`` once and return the
    parsed dict keyed by datatype name (e.g. ``SPHardwareDataType``).

    ``system_profiler`` is slow (hundreds of ms to a few seconds per
    invocation) -- callers should batch every datatype they need into a
    single call rather than one call per datatype, the way each scanner
    section used to call ``Get-CimInstance`` once per query on Windows.
    """
    out = run_cmd(["/usr/sbin/system_profiler", "-json", *datatypes], timeout=timeout)
    if not out:
        return {}
    try:
        return json.loads(out)
    except json.JSONDecodeError as err:
        raise RuntimeError(f"system_profiler did not return JSON: {err}; first 200: {out[:200]}")


def as_list(value: Any) -> list[Any]:
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
