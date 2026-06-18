"""Security section -- matches Antivirus/Bitlocker/Firewall/RDP/TPM/UAC/StartupApps.tsx.

Several Windows concepts have no macOS equivalent at all (third-party AV
products that hook a SecurityCenter2 API, UAC consent prompts, a discrete
TPM chip with owner/activation state) -- those keys come back empty/``{}``
rather than guessed, and the corresponding card renders its own "no data"
state. Where there *is* a real equivalent (BitLocker -> FileVault,
Windows Firewall -> Application Firewall, Get-HotFix -> softwareupdate
history) the same field names are populated from macOS sources.
"""

from __future__ import annotations

import shutil
from typing import Any

from .helpers import as_list, run_cmd, safe


def _collect_bitlocker() -> list[dict[str, Any]]:
    status = safe(run_cmd, "", ["/usr/bin/fdesetup", "status"])
    enabled = "filevault is on" in status.lower()
    usage = safe(lambda: shutil.disk_usage("/"), None)
    capacity_gb = (usage.total / 1e9) if usage else 0
    return [{
        "MountPoint": "/",
        "CapacityGB": capacity_gb,
        "VolumeType": 0,  # OS Volume
        "LockStatus": 0,  # macOS volumes aren't "locked" post-login the way BitLocker volumes are
        "ProtectionStatus": 1 if enabled else 0,
        "EncryptionMethod": 4 if enabled else 0,  # 4 == XTS-AES_256, what FileVault actually uses
        "VolumeStatus": 1 if enabled else 0,
        "KeyProtector": [],
    }]


def _collect_firewall_profile() -> list[dict[str, Any]]:
    alf = "/usr/libexec/ApplicationFirewall/socketfilterfw"
    state = safe(run_cmd, "", [alf, "--getglobalstate"])
    stealth = safe(run_cmd, "", [alf, "--getstealthmode"])
    enabled = 1 if "enabled" in state.lower() else 0
    stealth_on = 1 if "enabled" in stealth.lower() else 0
    return [{
        "Name": "Application Firewall",
        "Enabled": enabled,
        "AllowUserApps": None,
        "AllowUserPorts": None,
        "AllowInboundRules": None,
        "DefaultInboundAction": None,
        "DefaultOutboundAction": None,
        "AllowLocalFirewallRules": None,
        "EnableStealthModeForIPSec": stealth_on,
        "AllowUnicastResponseToMulticast": None,
    }]


def _collect_rdp_status() -> dict[str, Any]:
    # Closest macOS analog to RDP is Remote Login (SSH), which `systemsetup`
    # can read -- it requires root, same as the LaunchDaemon this runs under.
    out = safe(run_cmd, "", ["/usr/sbin/systemsetup", "-getremotelogin"])
    return {"RDP_Enabled": "on" in out.lower()}


def _parse_softwareupdate_history() -> list[dict[str, Any]]:
    out = safe(run_cmd, "", ["/usr/sbin/softwareupdate", "--history"], timeout=60)
    rows: list[dict[str, Any]] = []
    for line in out.splitlines():
        line = line.rstrip()
        if not line or line.startswith("Display Name") or line.startswith("="):
            continue
        # Columns are whitespace-padded ("Display Name  Version  Date"); take
        # the date as the trailing token and the rest as the update name.
        parts = line.rsplit(None, 1)
        if len(parts) != 2:
            continue
        name, date = parts
        rows.append({"hotfix_id": None, "description": name.strip(), "installedOn": date.strip()})
    return rows


def _collect_startup_apps() -> list[dict[str, Any]]:
    out = safe(run_cmd, "", ["/bin/launchctl", "list"])
    apps: list[dict[str, Any]] = []
    for line in out.splitlines()[1:]:  # header row: "PID  Status  Label"
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        label = parts[2]
        apps.append({"name": label, "location": "launchd", "command": None, "user": None})
    return apps


def collect_security() -> dict[str, Any]:
    return {
        "antivirus":        [],  # no SecurityCenter2-style AV registry on macOS
        "bitlocker":        as_list(safe(_collect_bitlocker, [])),
        "firewall_profile": as_list(safe(_collect_firewall_profile, [])),
        "rdp_status":       safe(_collect_rdp_status, {"RDP_Enabled": False}),
        "tpm":              {},  # no discrete TPM on Mac hardware
        "uac_status":       {},  # no UAC concept on macOS
        "updates":          as_list(safe(_parse_softwareupdate_history, [])),
        "startup_apps":     as_list(safe(_collect_startup_apps, [])),
    }
