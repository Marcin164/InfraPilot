"""InfraPilot Windows agent entry point.

Flow per invocation:

1. Load ``config.json`` (backend URL + bootstrap enrollment token).
2. Load ``state.json``. If missing/corrupt, self-enroll via
   ``POST /devices/agent/enroll`` and persist (device_id, secret).
3. Run requested section scanners and push payload to
   ``POST /devices/agent/data`` with an HMAC signature.

Installer (Inno Setup) passes ``--register-task`` / ``--unregister-task``
for scheduled-task lifecycle.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
import traceback
from pathlib import Path
from typing import Any, Callable

# PyInstaller freezes this file as the bare __main__ script (no package
# context), which breaks the relative imports below -- they'd raise
# "attempted relative import with no known parent package" at runtime
# despite building/importing fine unfrozen. Put windowsApp/ on sys.path so
# `agent` is importable as a top-level package regardless of how this file
# is invoked (frozen exe, `python agent/main.py`, or `python -m agent.main`).
if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agent import scanner
from agent.config import (
    DEFAULT_CONFIG_PATH, DEFAULT_STATE_PATH,
    AgentConfig, AgentState, dpapi_encrypt, load_config, load_state, write_state,
)
from agent.enrollment import enroll
from agent.transport import send_scan
from agent.tasks import claim_tasks, complete_task, fail_task


SECTION_COLLECTORS: dict[str, Callable[[], Any]] = {
    "system":           scanner.collect_system,
    "hardware":         scanner.collect_hardware,
    "software":         scanner.collect_software,
    "network":          scanner.collect_network,
    "security":         scanner.collect_security,
    "peripherals":      scanner.collect_peripherals,
    "events":           scanner.collect_events,
    "users_and_groups": scanner.collect_users,
}


def _setup_logging(verbose: bool, log_path: str | None) -> None:
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stderr)]
    if log_path:
        Path(log_path).parent.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.FileHandler(log_path, encoding="utf-8"))
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        handlers=handlers,
    )


def build_payload(sections: list[str]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    log = logging.getLogger("agent.scan")
    for name in sections:
        collector = SECTION_COLLECTORS.get(name)
        if collector is None:
            log.warning("Unknown section: %s -- skipping", name)
            continue
        try:
            log.info("Collecting %s", name)
            out[name] = collector()
        except Exception as err:  # noqa: BLE001
            log.error("Section %s failed: %s\n%s", name, err, traceback.format_exc())
    return out


def ensure_enrolled(cfg: AgentConfig, state_path: Path, force: bool = False) -> AgentState:
    log = logging.getLogger("agent.enroll")
    state = None if force else load_state(state_path)
    if state is not None:
        log.debug("Using existing enrollment: %s", state.device_id)
        return state
    log.info("No usable state -- performing enrollment.")
    result = enroll(cfg)
    write_state(
        state_path,
        device_id=result["deviceId"], secret_plaintext=result["secret"],
        matched=bool(result.get("matched")),
        match_reasons=result.get("matchReasons") or [],
    )
    log.info("Persisted state (device=%s, matched=%s)", result["deviceId"], result.get("matched"))
    return AgentState(device_id=result["deviceId"], secret=result["secret"])


def run_once(cfg: AgentConfig, state: AgentState, sections: list[str], dry_run: bool) -> int:
    payload = build_payload(sections)
    if dry_run:
        json.dump(payload, sys.stdout, indent=2, default=str)
        sys.stdout.write("\n")
        return 0
    result = send_scan(cfg, state, payload)
    logging.getLogger("agent").info("Scan accepted: %s", result)
    return 0


def process_tasks(cfg: AgentConfig, state: AgentState, sections: list[str]) -> None:
    """Claim and run queued admin tasks (Settings > device > Tasks tab).

    ``scan_now`` / ``inventory_refresh`` trigger a full scan; ``collect_event_log``
    re-sends just the events section. Anything else (``custom``) has no
    defined agent behaviour, so it's failed back with an explanatory error
    rather than silently dropped.
    """
    log = logging.getLogger("agent.tasks")
    try:
        claimed = claim_tasks(cfg, state)
    except Exception as err:  # noqa: BLE001
        log.warning("Task claim failed: %s", err)
        return

    for task in claimed:
        task_id, lease_token, task_type = task["id"], task["leaseToken"], task["type"]
        log.info("Running task %s (%s)", task_id, task_type)
        try:
            if task_type in ("scan_now", "inventory_refresh"):
                send_scan(cfg, state, build_payload(sections))
            elif task_type == "collect_event_log":
                send_scan(cfg, state, {"events": scanner.collect_events()})
            else:
                raise ValueError(f"Unsupported task type for this agent: {task_type}")
            complete_task(cfg, state, task_id, lease_token, {"ok": True})
        except Exception as err:  # noqa: BLE001
            log.error("Task %s failed: %s", task_id, err)
            try:
                fail_task(cfg, state, task_id, lease_token, str(err))
            except Exception as report_err:  # noqa: BLE001
                log.error("Failed to report task failure: %s", report_err)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="infrapilot-agent")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG_PATH)
    parser.add_argument("--state",  type=Path, default=DEFAULT_STATE_PATH)
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--watch", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--enroll-only", action="store_true")
    parser.add_argument("--force-enroll", action="store_true")
    parser.add_argument("--encrypt-stdin", action="store_true",
                        help="Read stdin, print DPAPI-encrypted form.")
    parser.add_argument("--register-task", action="store_true",
                        help="Register the InfraPilotAgent scheduled task.")
    parser.add_argument("--unregister-task", action="store_true",
                        help="Remove the InfraPilotAgent scheduled task.")
    parser.add_argument("--interval", type=int, default=60)
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--sections", type=str,
                        default=",".join(SECTION_COLLECTORS.keys()))
    args = parser.parse_args(argv)

    if args.encrypt_stdin:
        sys.stdout.write(dpapi_encrypt(sys.stdin.read().strip()))
        return 0

    if args.register_task:
        from .installer_core import register_scheduled_task
        register_scheduled_task(exe_path=Path(sys.executable), interval_minutes=args.interval)
        return 0

    if args.unregister_task:
        from .installer_core import unregister_scheduled_task
        unregister_scheduled_task()
        return 0

    if not (args.once or args.watch or args.dry_run or args.enroll_only):
        parser.error("Specify one of --once / --watch / --dry-run / --enroll-only.")

    sections = [s.strip() for s in args.sections.split(",") if s.strip()]

    if args.dry_run:
        _setup_logging(args.verbose, None)
        return run_once(
            AgentConfig(backend_url="", enrollment_token=""),
            AgentState(device_id="dry", secret="dry"),
            sections, dry_run=True,
        )

    cfg = load_config(args.config)
    _setup_logging(args.verbose, cfg.log_path)
    state = ensure_enrolled(cfg, args.state, force=args.force_enroll)
    if args.enroll_only:
        return 0
    if args.once:
        result = run_once(cfg, state, sections, dry_run=False)
        process_tasks(cfg, state, sections)
        return result

    # --watch
    log = logging.getLogger("agent")
    while True:
        try:
            run_once(cfg, state, sections, dry_run=False)
        except Exception as err:  # noqa: BLE001
            log.exception("Scan failed: %s", err)
        try:
            process_tasks(cfg, state, sections)
        except Exception as err:  # noqa: BLE001
            log.exception("Task processing failed: %s", err)
        sleep_for = max(60, cfg.interval_minutes * 60)
        log.info("Sleeping %ds before next scan.", sleep_for)
        time.sleep(sleep_for)


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
