"""systemd unit management -- replaces schtasks.exe (Windows) / launchd
(macOS).

Called by ``infrapilot-agent --register-task`` / ``--unregister-task``
from the .deb postinst script (see installer/postinst) and from the
GUI's privileged actions (``linuxauth.run_privileged``). A ``.timer``
unit plays the role of Windows' Task Scheduler interval / macOS'
``StartInterval`` -- ``OnUnitActiveSec`` schedules the next run that
many seconds after the previous run *finished*, the same "don't
overlap, just repeat" semantics as both.
"""

from __future__ import annotations

import logging
import subprocess
from pathlib import Path


log = logging.getLogger(__name__)

UNIT_NAME = "infrapilot-agent"
_SYSTEMD_DIR = Path("/etc/systemd/system")
SERVICE_PATH = _SYSTEMD_DIR / f"{UNIT_NAME}.service"
TIMER_PATH = _SYSTEMD_DIR / f"{UNIT_NAME}.timer"


def _systemctl(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["systemctl", *args], capture_output=True, text=True)


def register_service(*, exe_path: Path, interval_minutes: int = 60) -> None:
    interval_seconds = max(60, int(interval_minutes) * 60)

    SERVICE_PATH.write_text(
        "[Unit]\n"
        "Description=InfraPilot Agent (single scan)\n"
        "After=network-online.target\n"
        "Wants=network-online.target\n"
        "\n"
        "[Service]\n"
        "Type=oneshot\n"
        f"ExecStart={exe_path} --once\n",
        encoding="utf-8",
    )
    SERVICE_PATH.chmod(0o644)

    TIMER_PATH.write_text(
        "[Unit]\n"
        "Description=Run the InfraPilot Agent on a schedule\n"
        "\n"
        "[Timer]\n"
        "OnBootSec=1min\n"
        f"OnUnitActiveSec={interval_seconds}s\n"
        "AccuracySec=30s\n"
        "\n"
        "[Install]\n"
        "WantedBy=timers.target\n",
        encoding="utf-8",
    )
    TIMER_PATH.chmod(0o644)

    reload_proc = _systemctl(["daemon-reload"])
    if reload_proc.returncode != 0:
        raise RuntimeError(f"systemctl daemon-reload failed: {reload_proc.stderr.strip()[:500]}")

    # `enable --now` both symlinks into timers.target.wants/ (survives
    # reboot) and starts the timer immediately -- one call instead of
    # separate enable + start, mirroring launchd's `RunAtLoad: true`.
    proc = _systemctl(["enable", "--now", f"{UNIT_NAME}.timer"])
    if proc.returncode != 0:
        raise RuntimeError(
            f"systemctl enable --now failed (rc={proc.returncode}): "
            f"{(proc.stderr or proc.stdout).strip()[:500]}"
        )


def unregister_service() -> bool:
    existed = SERVICE_PATH.exists() or TIMER_PATH.exists()
    proc = _systemctl(["disable", "--now", f"{UNIT_NAME}.timer"])
    if proc.returncode != 0 and existed:
        log.warning(
            "systemctl disable --now returned rc=%d: %s",
            proc.returncode, (proc.stderr or proc.stdout).strip()[:500],
        )
    for path in (TIMER_PATH, SERVICE_PATH):
        if path.exists():
            path.unlink()
    _systemctl(["daemon-reload"])
    return existed
