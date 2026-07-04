"""Secret Service (libsecret) wrapper -- plays the same role
``keychain.py``/``dpapi.py`` play on macOS/Windows: an OS-native secret
store so ``config.json``/``state.json`` don't hold plaintext credentials.

Unlike Keychain (unlocked for root LaunchDaemons without a session) or
DPAPI (a machine-bound kernel API with no session requirement at all),
the Secret Service API (gnome-keyring/kwalletd) is a **per-login-session**
D-Bus service. It exists when an operator is logged into a desktop and
runs the GUI as themselves -- it does *not* exist for a headless
``systemd`` service running as root with nobody logged in, which is the
agent's normal unattended mode on a server. So this module is
best-effort: callers try it first and fall back to plain storage,
relying on the ``0600``/root-owned file and directory permissions
``config.py`` sets as the actual security boundary in that case -- the
same trust model already used by e.g. ``/etc/shadow`` or systemd
credential files on a headless box with no keyring to hand secrets to.
"""

from __future__ import annotations

import shutil
import subprocess


SERVICE_ATTRIBUTE = "com.infrapilot.agent"
_SECRET_TOOL = "secret-tool"


def _available() -> bool:
    return shutil.which(_SECRET_TOOL) is not None


def set_secret(account: str, secret: str) -> bool:
    """Store ``secret`` under ``account`` in the Secret Service keyring.

    Returns ``False`` (caller falls back to plain file storage) if
    ``secret-tool`` isn't installed or no keyring/session answers --
    both common on a server with no desktop session.
    """
    if not _available():
        return False
    try:
        proc = subprocess.run(
            [
                _SECRET_TOOL, "store", "--label", f"InfraPilot Agent ({account})",
                "service", SERVICE_ATTRIBUTE, "account", account,
            ],
            input=secret, capture_output=True, text=True, timeout=10,
        )
    except (OSError, subprocess.TimeoutExpired):
        return False
    return proc.returncode == 0


def get_secret(account: str) -> str | None:
    if not _available():
        return None
    try:
        proc = subprocess.run(
            [_SECRET_TOOL, "lookup", "service", SERVICE_ATTRIBUTE, "account", account],
            capture_output=True, text=True, timeout=10,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if proc.returncode != 0:
        return None
    value = proc.stdout.rstrip("\n")
    return value or None


def delete_secret(account: str) -> None:
    if not _available():
        return
    try:
        subprocess.run(
            [_SECRET_TOOL, "clear", "service", SERVICE_ATTRIBUTE, "account", account],
            capture_output=True, text=True, timeout=10,
        )
    except (OSError, subprocess.TimeoutExpired):
        pass
