"""HMAC-signed POST to ``/devices/agent/data`` -- matches AgentGuard.

    sigKey = sha256_hex(secret)
    body   = exact request body bytes
    sig    = HMAC_SHA256(sigKey, f"{timestamp}|{nonce}|{body}").hex()
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import secrets
from datetime import datetime, timezone
from typing import Any

import requests

from .config import AgentConfig, AgentState


log = logging.getLogger(__name__)


def _iso_timestamp() -> str:
    now = datetime.now(tz=timezone.utc)
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"


def _sign(secret: str, timestamp: str, nonce: str, body: bytes) -> str:
    key = hashlib.sha256(secret.encode("utf-8")).hexdigest()
    msg = f"{timestamp}|{nonce}|{body.decode('utf-8')}".encode("utf-8")
    return hmac.new(key.encode("ascii"), msg, hashlib.sha256).hexdigest()


def signed_post(
    cfg: AgentConfig,
    state: AgentState,
    path: str,
    payload: dict[str, Any],
) -> Any:
    """HMAC-signed POST against an AgentGuard-protected endpoint.

    Shared by ``send_scan`` (``/devices/agent/data``) and the task-queue
    client (``/devices/agent/tasks/...``) -- same signature scheme.
    """
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    timestamp = _iso_timestamp()
    nonce = secrets.token_hex(16)
    signature = _sign(state.secret, timestamp, nonce, body)

    verify: Any = cfg.verify_tls
    if cfg.verify_tls and cfg.ca_bundle:
        verify = cfg.ca_bundle

    log.info("POST %s%s (%d bytes)", cfg.backend_url, path, len(body))
    resp = requests.post(
        f"{cfg.backend_url}{path}",
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Device-Id": state.device_id,
            "X-Timestamp": timestamp,
            "X-Nonce": nonce,
            "X-Signature": signature,
            "X-Idempotency-Key": nonce,
            "User-Agent": "InfraPilotAgent/0.1 (+macos)",
        },
        timeout=cfg.timeout_seconds,
        verify=verify,
    )
    if resp.status_code >= 400:
        raise RuntimeError(f"Backend rejected {path}: HTTP {resp.status_code} -- {resp.text[:500]}")
    try:
        return resp.json()
    except ValueError:
        return {"raw": resp.text}


def send_scan(cfg: AgentConfig, state: AgentState, payload: dict[str, Any]) -> dict[str, Any]:
    return signed_post(cfg, state, "/devices/agent/data", payload)
