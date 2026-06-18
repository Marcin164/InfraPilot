"""launchd daemon management -- replaces schtasks.exe on Windows.

Called by ``infrapilot-agent --register-task`` / ``--unregister-task``
from the pkg installer's ``postinstall`` script (see
installer/scripts/postinstall) and from the GUI's privileged actions
(``macauth.run_privileged``).
"""

from __future__ import annotations

import logging
import plistlib
import subprocess
from pathlib import Path


log = logging.getLogger(__name__)

LABEL = "com.infrapilot.agent"
PLIST_PATH = Path("/Library/LaunchDaemons") / f"{LABEL}.plist"


def _run_launchctl(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["/bin/launchctl", *args],
        capture_output=True, text=True,
    )


def register_launch_daemon(*, exe_path: Path, interval_minutes: int = 60) -> None:
    plist = {
        "Label": LABEL,
        "ProgramArguments": [str(exe_path), "--once"],
        "StartInterval": max(60, int(interval_minutes) * 60),
        "RunAtLoad": True,
        "StandardOutPath": "/Library/Application Support/InfraPilot/agent/launchd.out.log",
        "StandardErrorPath": "/Library/Application Support/InfraPilot/agent/launchd.err.log",
    }
    PLIST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(PLIST_PATH, "wb") as f:
        plistlib.dump(plist, f)
    PLIST_PATH.chmod(0o644)

    # bootout first (idempotent re-register / upgrade) -- bootstrap fails
    # with "service already loaded" otherwise. Ignore its failure: bootout
    # on a daemon that was never loaded also returns non-zero.
    _run_launchctl(["bootout", f"system/{LABEL}"])

    proc = _run_launchctl(["bootstrap", "system", str(PLIST_PATH)])
    if proc.returncode != 0:
        raise RuntimeError(
            f"launchctl bootstrap failed (rc={proc.returncode}): "
            f"{(proc.stderr or proc.stdout).strip()[:500]}"
        )


def unregister_launch_daemon() -> bool:
    proc = _run_launchctl(["bootout", f"system/{LABEL}"])
    existed = PLIST_PATH.exists()
    if PLIST_PATH.exists():
        PLIST_PATH.unlink()
    if proc.returncode != 0 and existed:
        log.warning(
            "launchctl bootout returned rc=%d: %s",
            proc.returncode, (proc.stderr or proc.stdout).strip()[:500],
        )
    return existed
