"""Network section -- matches Network.tsx.

``adapters``/``connections``/``net_stats`` are pure ``psutil`` and carry
over from the Windows/macOS agents unchanged (psutil already abstracts
these cross-platform). ``nic_config`` (per-interface alias/IP/gateway/
DNS/MAC), ``firewall_rules``, ``mapped_drives`` and ``shares`` have no
WMI/CIM equivalent and are rebuilt from Linux-native sources below --
``ip``/``/etc/resolv.conf``/``findmnt`` are part of every distro's base
system (iproute2 + util-linux), unlike the firewall frontends
(ufw/firewalld/nftables/iptables) which are mutually exclusive and
detected in that priority order.
"""

from __future__ import annotations

import re
import shutil
from typing import Any

import psutil

from .helpers import as_list, read_text, safe, try_cmd


def _collect_adapters() -> dict[str, list[dict[str, Any]]]:
    out: dict[str, list[dict[str, Any]]] = {}
    for name, addrs in psutil.net_if_addrs().items():
        out[name] = [{
            "family": str(a.family), "address": a.address,
            "netmask": a.netmask, "broadcast": a.broadcast, "ptp": a.ptp,
        } for a in addrs]
    return out


def _collect_net_stats() -> dict[str, dict[str, Any]]:
    counters = psutil.net_io_counters(pernic=True)
    return {
        nic: {
            "bytes_sent":    c.bytes_sent,
            "bytes_recv":    c.bytes_recv,
            "packets_sent":  c.packets_sent,
            "packets_recv":  c.packets_recv,
            "errin":         c.errin,
            "errout":        c.errout,
            "dropin":        c.dropin,
            "dropout":       c.dropout,
        }
        for nic, c in counters.items()
    }


def _collect_connections() -> list[dict[str, Any]]:
    conns: list[dict[str, Any]] = []
    pids: dict[int, str] = {}
    for c in psutil.net_connections(kind="inet"):
        pid = c.pid or 0
        if pid and pid not in pids:
            try:
                pids[pid] = psutil.Process(pid).name()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pids[pid] = ""
        conns.append({
            "pid": pid, "process_name": pids.get(pid, ""),
            "family": str(c.family), "type": str(c.type), "status": c.status,
            "laddr": f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else "",
            "raddr": f"{c.raddr.ip}:{c.raddr.port}" if c.raddr else "",
        })
    return conns


def _default_route() -> tuple[str | None, str | None]:
    out = try_cmd(["ip", "-4", "route", "show", "default"])
    m = re.search(r"default via (\S+) dev (\S+)", out)
    return (m.group(1), m.group(2)) if m else (None, None)


def _dns_servers() -> list[str]:
    raw = read_text("/etc/resolv.conf") or ""
    servers: list[str] = []
    for line in raw.splitlines():
        m = re.match(r"\s*nameserver\s+(\S+)", line)
        if m and m.group(1) not in servers:
            servers.append(m.group(1))
    return servers


def _interface_is_dhcp(name: str) -> bool:
    # The kernel tags an address "dynamic" in `ip addr` output once it has
    # a lease lifetime attached (DHCP/SLAAC) -- a static/manually-assigned
    # address has no such flag. No NetworkManager/dhclient dependency.
    out = try_cmd(["ip", "-4", "addr", "show", "dev", name])
    return "dynamic" in out


def _collect_nic_config() -> list[dict[str, Any]]:
    gateway, default_iface = _default_route()
    dns = _dns_servers()
    stats = psutil.net_if_stats()
    addrs = psutil.net_if_addrs()

    out: list[dict[str, Any]] = []
    for name, iface_addrs in addrs.items():
        stat = stats.get(name)
        ipv4 = next((a.address for a in iface_addrs if a.family.name == "AF_INET"), None)
        netmask = next((a.netmask for a in iface_addrs if a.family.name == "AF_INET"), None)
        ipv6_global = next(
            (a.address for a in iface_addrs if a.family.name == "AF_INET6" and not a.address.startswith("fe80")),
            None,
        )
        ipv6_local = next(
            (a.address for a in iface_addrs if a.family.name == "AF_INET6" and a.address.startswith("fe80")),
            None,
        )
        mac = next((a.address for a in iface_addrs if a.family.name == "AF_PACKET"), None)
        is_default = name == default_iface

        out.append({
            "InterfaceAlias": name,
            "InterfaceDescription": name,
            "Speed(Mbps)": getattr(stat, "speed", 0) or 0,
            "Connected": bool(getattr(stat, "isup", False)),
            "DHCP": 1 if (ipv4 and safe(_interface_is_dhcp, False, name)) else 0,
            "IPv4Address": ipv4,
            "NetMask": netmask,
            "IPv4Gateway": gateway if is_default else None,
            "IPv6Address": ipv6_global,
            "IPv6Gateway": None,
            "IPv6LinkLocal": ipv6_local,
            "DNSServers": {"value": dns if is_default else []},
            "MAC": mac,
        })
    return out


def _ufw_rules() -> list[dict[str, Any]] | None:
    out = try_cmd(["ufw", "status"])
    if not out:
        return None
    enabled = out.strip().lower().startswith("status: active")
    return [{
        "Name": "ufw", "DisplayName": "Uncomplicated Firewall (ufw)",
        "Enabled": 1 if enabled else 0, "Profile": 7, "Direction": 1,
        "Action": 1 if enabled else 0,
        "AllowUserApps": None, "AllowUserPorts": None, "AllowInboundRules": None,
        "DefaultInboundAction": None, "DefaultOutboundAction": None,
        "AllowLocalFirewallRules": None, "EnableStealthModeForIPSec": None,
        "AllowUnicastResponseToMulticast": None,
    }]


def _firewalld_rules() -> list[dict[str, Any]] | None:
    out = try_cmd(["firewall-cmd", "--state"])
    if not out:
        return None
    enabled = out.strip() == "running"
    return [{
        "Name": "firewalld", "DisplayName": "firewalld",
        "Enabled": 1 if enabled else 0, "Profile": 7, "Direction": 1,
        "Action": 1 if enabled else 0,
        "AllowUserApps": None, "AllowUserPorts": None, "AllowInboundRules": None,
        "DefaultInboundAction": None, "DefaultOutboundAction": None,
        "AllowLocalFirewallRules": None, "EnableStealthModeForIPSec": None,
        "AllowUnicastResponseToMulticast": None,
    }]


def _nftables_rules() -> list[dict[str, Any]] | None:
    out = try_cmd(["nft", "list", "ruleset"])
    if not out.strip():
        return None
    return [{
        "Name": "nftables", "DisplayName": "nftables",
        "Enabled": 1, "Profile": 7, "Direction": 1, "Action": 1,
        "AllowUserApps": None, "AllowUserPorts": None, "AllowInboundRules": None,
        "DefaultInboundAction": None, "DefaultOutboundAction": None,
        "AllowLocalFirewallRules": None, "EnableStealthModeForIPSec": None,
        "AllowUnicastResponseToMulticast": None,
    }]


def _iptables_rules() -> list[dict[str, Any]] | None:
    out = try_cmd(["iptables", "-S"])
    if not out.strip():
        return None
    return [{
        "Name": "iptables", "DisplayName": "iptables",
        "Enabled": 1, "Profile": 7, "Direction": 1, "Action": 1,
        "AllowUserApps": None, "AllowUserPorts": None, "AllowInboundRules": None,
        "DefaultInboundAction": None, "DefaultOutboundAction": None,
        "AllowLocalFirewallRules": None, "EnableStealthModeForIPSec": None,
        "AllowUnicastResponseToMulticast": None,
    }]


def _collect_firewall_rules() -> list[dict[str, Any]]:
    # Mutually exclusive in practice (a distro ships one front-end for the
    # kernel packet filter, not several) -- first one that answers wins.
    for detector in (_ufw_rules, _firewalld_rules, _nftables_rules, _iptables_rules):
        result = safe(detector, None)
        if result is not None:
            return result
    return []


_NETWORK_FS_TYPES = {"cifs", "smb3", "smbfs", "nfs", "nfs4"}


def _collect_mapped_drives() -> list[dict[str, Any]]:
    out = try_cmd(["findmnt", "-rn", "-o", "SOURCE,TARGET,FSTYPE"])
    drives: list[dict[str, Any]] = []
    for line in out.splitlines():
        parts = line.split()
        if len(parts) != 3:
            continue
        source, mount_point, fstype = parts
        if fstype not in _NETWORK_FS_TYPES:
            continue
        usage = safe(shutil.disk_usage, None, mount_point)
        drives.append({
            "DriveLetter": mount_point,
            "RemotePath": source,
            "FileSystem": fstype,
            "SizeGB": round(usage.total / 1e9, 2) if usage else None,
            "FreeGB": round(usage.free / 1e9, 2) if usage else None,
        })
    return drives


_SMB_SECTION_RE = re.compile(r"^\s*\[([^\]]+)\]\s*$")
_SMB_SPECIAL_SECTIONS = {"global", "printers", "print$", "homes"}


def _samba_shares() -> list[dict[str, Any]]:
    raw = read_text("/etc/samba/smb.conf")
    if not raw:
        return []
    shares: list[dict[str, Any]] = []
    current_name: str | None = None
    current_path: str | None = None

    def _flush() -> None:
        if current_name and current_name.lower() not in _SMB_SPECIAL_SECTIONS:
            shares.append({
                "Name": current_name, "Path": current_path,
                "Description": None, "CurrentUsers": 0,
            })

    for line in raw.splitlines():
        section = _SMB_SECTION_RE.match(line)
        if section:
            _flush()
            current_name, current_path = section.group(1), None
            continue
        if current_name and "=" in line:
            key, _, value = line.partition("=")
            if key.strip().lower() == "path":
                current_path = value.strip()
    _flush()
    return shares


def _nfs_exports() -> list[dict[str, Any]]:
    raw = read_text("/etc/exports") or ""
    shares = []
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        path = line.split()[0]
        shares.append({"Name": path.rsplit("/", 1)[-1] or path, "Path": path, "Description": None, "CurrentUsers": 0})
    return shares


def _collect_shares() -> list[dict[str, Any]]:
    return safe(_samba_shares, []) + safe(_nfs_exports, [])


def collect_network() -> dict[str, Any]:
    return {
        "nic_config":     as_list(safe(_collect_nic_config, [])),
        "adapters":       safe(_collect_adapters, {}),
        "connections":    safe(_collect_connections, []),
        "firewall_rules": as_list(safe(_collect_firewall_rules, [])),
        "mapped_drives":  as_list(safe(_collect_mapped_drives, [])),
        "shares":         as_list(safe(_collect_shares, [])),
        "net_stats":      safe(_collect_net_stats, {}),
    }
