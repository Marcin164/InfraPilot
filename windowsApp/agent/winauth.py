"""Pure-ctypes Windows credential check -- used by the GUI to gate editing
of Backend URL / enrollment token behind the current user's own password.

Same rationale as dpapi.py: call advapi32.dll directly instead of pulling
in pywin32 for one function.
"""

from __future__ import annotations

import ctypes
import sys
from ctypes import wintypes


LOGON32_LOGON_INTERACTIVE = 2
LOGON32_PROVIDER_DEFAULT = 0


def verify_password(username: str, password: str, domain: str = ".") -> bool:
    """Validate ``password`` against the local Windows account ``username``.

    Returns False on any failure (wrong password, unknown account, locked
    out, etc.) rather than raising -- callers only care "did this unlock
    or not", and Win32 error codes aren't worth surfacing to an operator
    typing their own password into a settings dialog.
    """
    if sys.platform != "win32":
        return False

    advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

    advapi32.LogonUserW.argtypes = [
        wintypes.LPCWSTR, wintypes.LPCWSTR, wintypes.LPCWSTR,
        wintypes.DWORD, wintypes.DWORD, ctypes.POINTER(wintypes.HANDLE),
    ]
    advapi32.LogonUserW.restype = wintypes.BOOL

    token = wintypes.HANDLE()
    ok = advapi32.LogonUserW(
        username, domain, password,
        LOGON32_LOGON_INTERACTIVE, LOGON32_PROVIDER_DEFAULT,
        ctypes.byref(token),
    )
    if ok and token:
        kernel32.CloseHandle(token)
    return bool(ok)
