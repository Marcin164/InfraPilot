"""Security section -- matches Antivirus/Bitlocker/Firewall/RDP/TPM/UAC/StartupApps.tsx.

Several Windows concepts have no Linux equivalent at all (a
SecurityCenter2-style third-party AV registry, UAC consent prompts, a
discrete TPM chip exposed the same way ``Win32_Tpm`` exposes one) --
those keys come back empty/``{}`` rather than guessed; the frontend
already only renders the TPM/UAC cards when ``platform === "windows"``,
same treatment as macOS. Where there *is* a real equivalent (BitLocker
-> LUKS, Windows Firewall -> ufw/firewalld/nftables/iptables,
``Get-HotFix`` -> the distro package manager's update history) the same
field names are populated from Linux-native sources.
"""

from __future__ import annotations

import re
import shutil
from typing import Any

from .helpers import as_list, safe, try_cmd


def _root_device_name() -> str | None:
    out = try_cmd(["findmnt", "-n", "-o", "SOURCE", "/"])
    return out.rsplit("/", 1)[-1] if out else None


def _is_luks_encrypted(device_name: str) -> bool:
    status = try_cmd(["cryptsetup", "status", device_name])
    return bool(status) and "is active" in status.lower()


def _collect_bitlocker() -> list[dict[str, Any]]:
    device_name = safe(_root_device_name, None)
    encrypted = bool(device_name) and safe(_is_luks_encrypted, False, device_name)
    usage = safe(shutil.disk_usage, None, "/")
    capacity_gb = (usage.total / 1e9) if usage else 0
    return [{
        "MountPoint": "/",
        "CapacityGB": capacity_gb,
        "VolumeType": 0,  # OS Volume
        "LockStatus": 0,  # already mounted/unlocked, same as a post-login BitLocker volume
        "ProtectionStatus": 1 if encrypted else 0,
        # LUKS supports several ciphers (unlike FileVault's fixed
        # XTS-AES-256) -- 1 ("generic AES") is the closest honest value
        # without parsing `cryptsetup luksDump` for the actual cipher spec.
        "EncryptionMethod": 1 if encrypted else 0,
        "VolumeStatus": 1 if encrypted else 0,
        "KeyProtector": [],
    }]


def _firewall_backend_name() -> tuple[str, bool] | None:
    ufw = try_cmd(["ufw", "status"])
    if ufw:
        return "Uncomplicated Firewall (ufw)", ufw.strip().lower().startswith("status: active")
    firewalld = try_cmd(["firewall-cmd", "--state"])
    if firewalld:
        return "firewalld", firewalld.strip() == "running"
    nft = try_cmd(["nft", "list", "ruleset"])
    if nft.strip():
        return "nftables", True
    iptables = try_cmd(["iptables", "-S"])
    if iptables.strip():
        return "iptables", True
    return None


def _collect_firewall_profile() -> list[dict[str, Any]]:
    backend = safe(_firewall_backend_name, None)
    if backend is None:
        return []
    name, enabled = backend
    return [{
        "Name": name,
        "Enabled": 1 if enabled else 0,
        "AllowUserApps": None,
        "AllowUserPorts": None,
        "AllowInboundRules": None,
        "DefaultInboundAction": None,
        "DefaultOutboundAction": None,
        "AllowLocalFirewallRules": None,
        "EnableStealthModeForIPSec": None,
        "AllowUnicastResponseToMulticast": None,
    }]


def _collect_rdp_status() -> dict[str, Any]:
    # xrdp is the de facto RDP-protocol-compatible server on Linux desktops
    # (the closest analog to Windows' built-in Remote Desktop) -- absent on
    # a headless server, same as RDP being off by default on a Windows one.
    out = safe(try_cmd, "", ["systemctl", "is-active", "xrdp"])
    return {"RDP_Enabled": out.strip() == "active"}


def _apt_update_history() -> list[dict[str, Any]]:
    out = safe(try_cmd, "", ["zgrep", "-h", "^Start-Date", "/var/log/apt/history.log", "/var/log/apt/history.log.*.gz"])
    rows = []
    for line in out.splitlines():
        m = re.match(r"Start-Date:\s*(.+)", line)
        if m:
            rows.append({"hotfix_id": None, "description": "apt upgrade", "installedOn": m.group(1).strip()})
    return rows


def _dnf_update_history() -> list[dict[str, Any]]:
    out = try_cmd(["dnf", "history", "list"])
    rows = []
    for line in out.splitlines():
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 3 or not parts[0].isdigit():
            continue
        rows.append({"hotfix_id": parts[0], "description": parts[1], "installedOn": parts[2]})
    return rows


def _parse_softwareupdate_history() -> list[dict[str, Any]]:
    for collector in (_apt_update_history, _dnf_update_history):
        rows = safe(collector, [])
        if rows:
            return rows
    return []


def _collect_startup_apps() -> list[dict[str, Any]]:
    # systemd services enabled to start at boot -- the closest Linux
    # analog to Windows' registry Run keys / Startup folder (which are
    # per-user GUI-session concepts this headless agent has no visibility
    # into anyway).
    out = try_cmd(["systemctl", "list-unit-files", "--type=service", "--state=enabled", "--no-legend", "--no-pager"])
    apps = []
    for line in out.splitlines():
        name = line.split()[0] if line.split() else None
        if name:
            apps.append({"name": name, "location": "systemd", "command": None, "user": None})
    return apps


def collect_security() -> dict[str, Any]:
    return {
        "antivirus":        [],  # no SecurityCenter2-style AV registry on Linux
        "bitlocker":        as_list(safe(_collect_bitlocker, [])),
        "firewall_profile": as_list(safe(_collect_firewall_profile, [])),
        "rdp_status":       safe(_collect_rdp_status, {"RDP_Enabled": False}),
        "tpm":              {},  # frontend only renders this for platform == "windows"
        "uac_status":       {},  # no UAC concept on Linux
        "updates":          as_list(safe(_parse_softwareupdate_history, [])),
        "startup_apps":     as_list(safe(_collect_startup_apps, [])),
    }
