"""Config + state files on disk.

``config.json`` -- backend URL + bootstrap enrollment token. Either
written by the .deb postinst script (from ``BACKEND_URL``/``ENROLL_TOKEN``
env vars, see installer/postinst), or by the operator's GUI "Connect"
action.

``state.json`` -- written by the agent itself after a successful
enrollment: device id + agent secret.

Where a Secret Service keyring answers (an operator running the GUI in
a desktop session), ``enrollment_token``/``secret`` hold a
``secret-service:<account>`` reference resolved through
``secretstore.py``. Where none answers (the normal unattended
``systemd`` service case -- see that module's docstring), the value is
stored as-is and the ``0600``/root-owned file and directory permissions
set below are the security boundary instead.
"""

from __future__ import annotations

import datetime as _dt
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


PROGRAM_DATA_DIR = Path("/etc/infrapilot/agent")

DEFAULT_CONFIG_PATH = PROGRAM_DATA_DIR / "config.json"
DEFAULT_STATE_PATH = PROGRAM_DATA_DIR / "state.json"

_TOKEN_ACCOUNT = "enrollment_token"
_SECRET_ACCOUNT = "agent_secret"


@dataclass
class AgentConfig:
    backend_url: str
    enrollment_token: str
    interval_minutes: int = 60
    verify_tls: bool = True
    ca_bundle: Optional[str] = None
    timeout_seconds: int = 60
    log_path: Optional[str] = None


@dataclass
class AgentState:
    device_id: str
    secret: str


def _secure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(path, 0o700)
    except OSError:
        pass


def _secret_decrypt(value: str, account: str) -> str:
    if not value.startswith("secret-service:"):
        return value
    from . import secretstore

    resolved = secretstore.get_secret(account)
    if resolved is None:
        raise RuntimeError(f"Secret Service item missing for account={account!r}")
    return resolved


def secret_encrypt(plaintext: str, account: str) -> str:
    from . import secretstore

    if secretstore.set_secret(account, plaintext):
        return f"secret-service:{account}"
    return plaintext


def load_config(path: Path = DEFAULT_CONFIG_PATH) -> AgentConfig:
    if not path.exists():
        raise FileNotFoundError(
            f"Config not found at {path}. Pass BACKEND_URL=... ENROLL_TOKEN=... "
            "to the installer or rerun setup from the tray app."
        )
    raw = json.loads(path.read_text(encoding="utf-8"))
    for key in ("backend_url", "enrollment_token"):
        if not raw.get(key):
            raise ValueError(f"Config missing required key: {key}")
    return AgentConfig(
        backend_url=raw["backend_url"].rstrip("/"),
        enrollment_token=_secret_decrypt(raw["enrollment_token"], _TOKEN_ACCOUNT),
        interval_minutes=int(raw.get("interval_minutes", 60)),
        verify_tls=bool(raw.get("verify_tls", True)),
        ca_bundle=raw.get("ca_bundle") or None,
        timeout_seconds=int(raw.get("timeout_seconds", 60)),
        log_path=raw.get("log_path") or None,
    )


def load_state(path: Path = DEFAULT_STATE_PATH) -> Optional[AgentState]:
    if not path.exists():
        return None
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    device_id = raw.get("device_id")
    secret_ref = raw.get("secret")
    if not device_id or not secret_ref:
        return None
    try:
        return AgentState(device_id=device_id, secret=_secret_decrypt(secret_ref, _SECRET_ACCOUNT))
    except Exception:
        return None


def write_state(
    path: Path,
    *,
    device_id: str,
    secret_plaintext: str,
    matched: bool,
    match_reasons: Optional[list[str]] = None,
) -> None:
    _secure_dir(path.parent)
    payload = {
        "device_id": device_id,
        "secret": secret_encrypt(secret_plaintext, _SECRET_ACCOUNT),
        "matched": matched,
        "match_reasons": match_reasons or [],
        "enrolled_at": _dt.datetime.now(tz=_dt.timezone.utc).isoformat(),
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    path.chmod(0o600)


def read_state_raw(path: Path = DEFAULT_STATE_PATH) -> Optional[dict]:
    """Undecrypted state.json, for display purposes (GUI status panel)."""
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def touch_last_scan(path: Path, when: str) -> None:
    raw = read_state_raw(path)
    if raw is None:
        return
    raw["last_scan_at"] = when
    path.write_text(json.dumps(raw, indent=2), encoding="utf-8")


def save_config(
    path: Path,
    *,
    backend_url: str,
    enrollment_token: str,
    interval_minutes: int = 60,
    verify_tls: bool = True,
    ca_bundle: Optional[str] = None,
    timeout_seconds: int = 60,
    log_path: Optional[str] = None,
) -> None:
    """Write config.json -- used by the tray app's "Connect" action. The
    .deb postinst script writes this same shape from ``BACKEND_URL``/
    ``ENROLL_TOKEN`` env vars; this is the interactive equivalent for an
    operator who'd rather not use the CLI/terminal.
    """
    _secure_dir(path.parent)
    payload = {
        "backend_url": backend_url.rstrip("/"),
        "enrollment_token": secret_encrypt(enrollment_token, _TOKEN_ACCOUNT),
        "interval_minutes": interval_minutes,
        "verify_tls": verify_tls,
        "ca_bundle": ca_bundle,
        "timeout_seconds": timeout_seconds,
        "log_path": log_path,
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    path.chmod(0o600)
