"""Shared helpers -- shell invocation + /sys,/proc readers + safe defaults."""

from __future__ import annotations

import logging
import subprocess
from pathlib import Path
from typing import Any


log = logging.getLogger(__name__)

_DMI_ROOT = Path("/sys/class/dmi/id")


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


def try_cmd(args: list[str], timeout: int = 60) -> str:
    """Like ``run_cmd`` but returns "" instead of raising -- for optional
    tools (dmidecode, lsusb, ...) that may simply not be installed."""
    try:
        return run_cmd(args, timeout=timeout)
    except (RuntimeError, OSError, FileNotFoundError, subprocess.TimeoutExpired):
        return ""


def read_dmi(field: str) -> str | None:
    """Read ``/sys/class/dmi/id/<field>`` (board_serial, product_name, ...).

    Several fields (product_serial, board_serial, product_uuid) are
    root-only (0400) on most distros -- this agent runs as root via
    systemd, but returns ``None`` rather than raising when unreadable so
    callers degrade the same way they would for hardware that just
    doesn't report the field at all.
    """
    try:
        value = (_DMI_ROOT / field).read_text(encoding="utf-8", errors="replace").strip()
    except OSError:
        return None
    if not value or value.lower() in ("none", "not specified", "to be filled by o.e.m.", "default string"):
        return None
    return value


def read_text(path: str) -> str | None:
    try:
        return Path(path).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None


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
