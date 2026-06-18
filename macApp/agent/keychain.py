"""``security`` CLI wrapper against the System keychain.

Plays the same role ``dpapi.py`` plays on Windows: a machine-bound secret
store so copying ``config.json``/``state.json`` to another host yields
nothing usable. We don't shell out to ``security`` and parse a self-rolled
encrypted blob the way DPAPI returns one -- the macOS-idiomatic equivalent
is to let Keychain hold the secret directly, keyed by a fixed account name,
and store only a ``keychain:<account>`` reference inline in the JSON files.

Targets the **System** keychain explicitly (``-k``), not the per-user login
keychain: the agent runs unattended as root via a LaunchDaemon with no
logged-in session, and the System keychain is the one macOS keeps unlocked
for root-owned daemons without a GUI unlock prompt (the same place e.g.
Wi-Fi passwords shared system-wide live).
"""

from __future__ import annotations

import subprocess
import sys


SERVICE_NAME = "com.infrapilot.agent"
SYSTEM_KEYCHAIN = "/Library/Keychains/System.keychain"
_SECURITY = "/usr/bin/security"

# `security find-generic-password` exits 44 when the item simply doesn't
# exist yet (first run, or never connected) -- not an error worth raising.
_ERRSEC_ITEM_NOT_FOUND = 44


def set_secret(account: str, secret: str) -> None:
    if sys.platform != "darwin":
        raise RuntimeError("Keychain is only available on macOS")
    # `-U` updates the item in place if it already exists instead of
    # failing with "already exists" -- this runs on every save, not just
    # the first one.
    proc = subprocess.run(
        [
            _SECURITY, "add-generic-password",
            "-a", account, "-s", SERVICE_NAME, "-w", secret,
            "-U", "-k", SYSTEM_KEYCHAIN,
        ],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"security add-generic-password failed (rc={proc.returncode}): "
            f"{(proc.stderr or proc.stdout).strip()[:500]}"
        )


def get_secret(account: str) -> str | None:
    if sys.platform != "darwin":
        raise RuntimeError("Keychain is only available on macOS")
    proc = subprocess.run(
        [
            _SECURITY, "find-generic-password",
            "-a", account, "-s", SERVICE_NAME, "-w", "-k", SYSTEM_KEYCHAIN,
        ],
        capture_output=True, text=True,
    )
    if proc.returncode == _ERRSEC_ITEM_NOT_FOUND:
        return None
    if proc.returncode != 0:
        raise RuntimeError(
            f"security find-generic-password failed (rc={proc.returncode}): "
            f"{(proc.stderr or proc.stdout).strip()[:500]}"
        )
    return proc.stdout.strip("\n")


def delete_secret(account: str) -> None:
    if sys.platform != "darwin":
        return
    subprocess.run(
        [
            _SECURITY, "delete-generic-password",
            "-a", account, "-s", SERVICE_NAME, "-k", SYSTEM_KEYCHAIN,
        ],
        capture_output=True, text=True,
    )
