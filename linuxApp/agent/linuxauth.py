"""Privileged-action helper for the unprivileged GUI -- replaces winauth.py/
macauth.py.

Windows' ``winauth.py`` exists because the whole Tkinter GUI runs UAC-
elevated for its entire lifetime, so it gates further edits with a
password re-check. macOS' ``macauth.py`` instead re-invokes itself via
``osascript ... with administrator privileges`` per action. Linux's
native equivalent of both is PolicyKit: ``pkexec`` re-runs a single
command as root and pops whatever native auth-agent dialog the desktop
environment provides (GNOME/KDE/XFCE all ship one) prompting for the
*invoking user's own* password (or root's, depending on the polkit
action's ``auth_admin`` policy) -- no separate re-auth mechanism needed
here, same rationale as macOS.

This agent's GUI (``gui.py``) therefore runs **unprivileged** as the
logged-in user, and every privileged action (writing config.json/
state.json under /etc/infrapilot, Secret Service writes under the
invoking user's own session, systemd unit register/unregister) goes
through ``pkexec`` for that one command.
"""

from __future__ import annotations

import shutil
import subprocess


class PrivilegedActionCancelled(Exception):
    """The user dismissed the polkit authentication dialog."""


# pkexec exit codes: 126 = auth dialog dismissed/not authorized, 127 = pkexec
# itself missing/misconfigured. Anything else is the wrapped command's own
# exit code.
_PKEXEC_AUTH_DISMISSED = 126
_PKEXEC_NOT_AUTHORIZED = 127


def run_privileged(args: list[str]) -> str:
    """Run ``args`` elevated via PolicyKit. Returns stdout.

    Raises ``PrivilegedActionCancelled`` if the user dismisses the
    prompt (or isn't authorized), or ``RuntimeError`` for any other
    failure -- including ``pkexec`` not being installed, which is the
    case on some minimal/headless distros without a desktop stack.
    """
    if shutil.which("pkexec") is None:
        raise RuntimeError(
            "pkexec is not installed -- install policykit-1 (Debian/Ubuntu) "
            "or polkit (Fedora/Arch), or run this action as root directly."
        )
    proc = subprocess.run(["pkexec", *args], capture_output=True, text=True)
    if proc.returncode in (_PKEXEC_AUTH_DISMISSED, _PKEXEC_NOT_AUTHORIZED):
        raise PrivilegedActionCancelled("PolicyKit authentication was dismissed or denied.")
    if proc.returncode != 0:
        stderr = (proc.stderr or "").strip()
        raise RuntimeError(f"Privileged command failed (rc={proc.returncode}): {stderr[:500]}")
    return proc.stdout
