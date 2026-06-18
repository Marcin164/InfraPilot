"""Privileged-action helper for the unprivileged GUI -- replaces winauth.py.

Windows' ``winauth.py`` exists because the *whole* Tkinter GUI runs
elevated (UAC once at launch via an embedded manifest) -- without an
extra password re-check, anyone at an already-open, already-elevated
window could silently repoint the agent. macOS has no equivalent of
launching a double-clicked .app pre-elevated.

Instead, this agent's GUI (``gui.py``) runs **unprivileged** as the
logged-in user, and every privileged action (writing config.json/
state.json under /Library/Application Support, Keychain writes, launchd
register/unregister) goes through ``osascript ... with administrator
privileges``, which pops the native macOS admin-password dialog for
*that one action*. That is a stronger guarantee than Windows' "elevate
once, then gate further edits with a password field" -- so there is no
``verify_password`` re-auth step to reimplement here.
"""

from __future__ import annotations

import shlex
import subprocess
import sys


class PrivilegedActionCancelled(Exception):
    """The user dismissed the administrator-privileges prompt."""


def _escape_for_applescript(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def run_privileged(args: list[str], prompt: str = "InfraPilot Agent wants to make changes.") -> str:
    """Run ``args`` elevated via the native macOS admin prompt.

    Returns stdout. Raises ``PrivilegedActionCancelled`` if the user
    dismisses the prompt, or ``RuntimeError`` for any other failure.
    """
    if sys.platform != "darwin":
        raise RuntimeError("Privileged execution is only available on macOS")

    shell_command = shlex.join(args)
    script = (
        f'do shell script "{_escape_for_applescript(shell_command)}" '
        f'with administrator privileges with prompt "{_escape_for_applescript(prompt)}"'
    )
    proc = subprocess.run(
        ["/usr/bin/osascript", "-e", script],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        stderr = (proc.stderr or "").strip()
        if "-128" in stderr or "User canceled" in stderr:
            raise PrivilegedActionCancelled("Administrator prompt was dismissed.")
        raise RuntimeError(f"Privileged command failed: {stderr[:500]}")
    return proc.stdout
