"""Network section -- matches Network.tsx.

``adapters``/``connections``/``net_stats`` are pure ``psutil`` and carry
over from the Windows agent unchanged (psutil already abstracts these
cross-platform). ``nic_config`` (per-interface alias/IP/gateway/DNS/MAC),
``firewall_rules``, ``mapped_drives`` and ``shares`` have no WMI/CIM
equivalent and are rebuilt from macOS-native sources below.
"""

from __future__ import annotations

import re
from typing import Any

import psutil

from .helpers import as_list, run_cmd, safe


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
    """Returns (gateway_ip, interface_name) of the default IPv4 route."""
    out = safe(run_cmd, "", ["/sbin/route", "-n", "get", "default"])
    gateway = None
    iface = None
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("gateway:"):
            gateway = line.split(":", 1)[1].strip()
        elif line.startswith("interface:"):
            iface = line.split(":", 1)[1].strip()
    return gateway, iface


def _dns_servers() -> list[str]:
    out = safe(run_cmd, "", ["/usr/sbin/scutil", "--dns"])
    servers: list[str] = []
    for line in out.splitlines():
        m = re.match(r"\s*nameserver\[\d+\]\s*:\s*(\S+)", line)
        if m and m.group(1) not in servers:
            servers.append(m.group(1))
    return servers


def _interface_is_dhcp(name: str) -> bool:
    # A successful DHCP lease query means the interface got its config
    # via DHCP; a static/manual interface (or one with no lease) errors out.
    return safe(lambda: bool(run_cmd(["/usr/sbin/ipconfig", "getpacket", name])), False)


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
        mac = next((a.address for a in iface_addrs if a.family.name == "AF_LINK"), None)
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


def _collect_firewall_rules() -> list[dict[str, Any]]:
    # macOS' Application Firewall is a single global on/off + stealth-mode
    # switch (per-app allow/block, not per-rule like Windows Firewall) --
    # one synthetic "rule" reflecting that global state, rather than a
    # brittle parse of `socketfilterfw --listapps` per-app output.
    alf = "/usr/libexec/ApplicationFirewall/socketfilterfw"
    state = safe(run_cmd, "", [alf, "--getglobalstate"])
    stealth = safe(run_cmd, "", [alf, "--getstealthmode"])
    enabled = 1 if "enabled" in state.lower() else 0
    stealth_on = 1 if "enabled" in stealth.lower() else 0
    return [{
        "Name": "ApplicationFirewall",
        "DisplayName": "macOS Application Firewall",
        "Enabled": enabled,
        "Profile": 7,
        "Direction": 1,
        "Action": 1 if enabled else 0,
        "AllowUserApps": None,
        "AllowUserPorts": None,
        "AllowInboundRules": None,
        "DefaultInboundAction": None,
        "DefaultOutboundAction": None,
        "AllowLocalFirewallRules": None,
        "EnableStealthModeForIPSec": stealth_on,
        "AllowUnicastResponseToMulticast": None,
    }]


_MOUNT_LINE_RE = re.compile(r"^(.*) on (/Volumes/\S+) \((\w+)")


def _collect_mapped_drives() -> list[dict[str, Any]]:
    out = safe(run_cmd, "", ["/sbin/mount"])
    drives: list[dict[str, Any]] = []
    for line in out.splitlines():
        m = _MOUNT_LINE_RE.match(line)
        if not m:
            continue
        remote, mount_point, fstype = m.groups()
        if fstype not in ("smbfs", "nfs", "afpfs", "webdav"):
            continue
        usage = safe(lambda p=mount_point: __import__("shutil").disk_usage(p), None)
        drives.append({
            "DriveLetter": mount_point.rsplit("/", 1)[-1],
            "RemotePath": remote,
            "FileSystem": fstype,
            "SizeGB": round(usage.total / 1e9, 2) if usage else None,
            "FreeGB": round(usage.free / 1e9, 2) if usage else None,
        })
    return drives


def _collect_shares() -> list[dict[str, Any]]:
    out = safe(run_cmd, "", ["/usr/sbin/sharing", "-l"])
    shares: list[dict[str, Any]] = []
    current: dict[str, Any] = {}
    for line in out.splitlines():
        line = line.rstrip()
        if line.startswith("name:"):
            if current.get("Name"):
                shares.append(current)
            current = {"Name": line.split(":", 1)[1].strip(), "Path": None, "Description": None, "CurrentUsers": 0}
        elif line.strip().startswith("path:") and current:
            current["Path"] = line.split(":", 1)[1].strip()
    if current.get("Name"):
        shares.append(current)
    return shares


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
