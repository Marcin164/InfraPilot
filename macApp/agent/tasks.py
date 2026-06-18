"""Agent task queue client -- POST /devices/agent/tasks/{claim,complete,fail}.

Backend side: ``AgentTaskService`` (queue/lease) + the "Tasks" tab on a
device's detail page, where an admin enqueues ``scan_now`` /
``collect_event_log`` / ``inventory_refresh`` work. The agent is expected
to claim queued tasks, run them, and report back -- this module is that
side of the contract.
"""

from __future__ import annotations

import logging
from typing import Any

from .config import AgentConfig, AgentState
from .transport import signed_post


log = logging.getLogger(__name__)


def claim_tasks(cfg: AgentConfig, state: AgentState, max_count: int = 5) -> list[dict[str, Any]]:
    result = signed_post(cfg, state, "/devices/agent/tasks/claim", {"max": max_count})
    return result if isinstance(result, list) else []


def complete_task(
    cfg: AgentConfig,
    state: AgentState,
    task_id: str,
    lease_token: str,
    result: dict[str, Any] | None = None,
) -> None:
    signed_post(
        cfg, state, f"/devices/agent/tasks/{task_id}/complete",
        {"leaseToken": lease_token, "result": result or {}},
    )


def fail_task(
    cfg: AgentConfig,
    state: AgentState,
    task_id: str,
    lease_token: str,
    error: str,
) -> None:
    signed_post(
        cfg, state, f"/devices/agent/tasks/{task_id}/fail",
        {"leaseToken": lease_token, "error": error[:2000]},
    )
