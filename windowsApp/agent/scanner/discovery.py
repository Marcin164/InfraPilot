"""Network discovery -- ping + ARP sweep of a CIDR range, for the
``network_scan`` agent task. Not part of ``scanner/__init__.py``'s
``SECTION_COLLECTORS`` -- those describe *this* machine; this describes
other machines on the network, and is only invoked from task handling
(see ``main.py``'s ``process_tasks()``).
"""

from __future__ import annotations

import concurrent.futures
import ipaddress
import logging
import os
import socket
import subprocess
from typing import Any

from .helpers import run_powershell


log = logging.getLogger(__name__)

# Mirrors the backend's MAX_NETWORK_SCAN_ADDRESSES bound (devices.controller.ts)
# -- belt and suspenders in case a task ever reaches us with a wider CIDR.
MAX_HOSTS = 1024
PING_TIMEOUT_MS = 500
SWEEP_WORKERS = 64
DNS_TIMEOUT_S = 1.5

# Credential-less signal only -- just "is something listening here", no
# banner grab or auth attempt. Picked to distinguish the coarse device
# classes the backend cares about (see classifyDevice.ts): SSH (network
# gear/Linux), web mgmt UI, SMB/RDP (Windows), IPP/JetDirect (printers).
SCAN_PORTS = (22, 80, 443, 445, 3389, 631, 9100)
PORT_CONNECT_TIMEOUT_S = 0.3

_NEIGHBORS_PS = r"""
Get-NetNeighbor -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.State -notin @('Unreachable', 'Incomplete') } |
  ForEach-Object {
    [pscustomobject]@{
      IPAddress = $_.IPAddress
      MAC       = $_.LinkLayerAddress
    }
  }
"""


def _ping_exe() -> str:
    """Absolute path, same rationale as helpers.py's _powershell_exe() --
    avoid relying on PATH under Task Scheduler/SYSTEM contexts."""
    system_root = os.environ.get("SystemRoot", r"C:\Windows")
    candidate = os.path.join(system_root, "System32", "ping.exe")
    return candidate if os.path.isfile(candidate) else "ping.exe"


def _ping_once(ip: str) -> bool:
    try:
        proc = subprocess.run(
            [_ping_exe(), "-n", "1", "-w", str(PING_TIMEOUT_MS), ip],
            capture_output=True,
            timeout=(PING_TIMEOUT_MS / 1000) + 2,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        return proc.returncode == 0
    except Exception:  # noqa: BLE001
        return False


def _reverse_dns(ip: str) -> str | None:
    try:
        return socket.gethostbyaddr(ip)[0]
    except Exception:  # noqa: BLE001
        return None


def _resolve_hostnames(ips: list[str]) -> dict[str, str | None]:
    """Best-effort reverse DNS for every candidate IP, bounded by wall
    clock rather than per-call timeouts.

    ``socket.setdefaulttimeout`` does *not* reliably bound
    ``gethostbyaddr`` on Windows for a negative result (a "host not
    found" lookup measured ~4.5s in practice regardless of the timeout
    set) -- the OS resolver does its own retry/backoff below Python's
    socket layer. So instead of trusting a per-call timeout, cap the
    whole phase: whatever hasn't resolved by the deadline is reported as
    no hostname rather than letting a handful of slow lookups stall the
    task.
    """
    if not ips:
        return {}
    batches = -(-len(ips) // SWEEP_WORKERS)  # ceil
    budget_s = max(10.0, batches * DNS_TIMEOUT_S * 4)

    pool = concurrent.futures.ThreadPoolExecutor(max_workers=SWEEP_WORKERS)
    futures = {pool.submit(_reverse_dns, ip): ip for ip in ips}
    done, _pending = concurrent.futures.wait(futures, timeout=budget_s)
    hostnames = {futures[f]: f.result() for f in done}
    pool.shutdown(wait=False)
    return hostnames


def _check_port(ip: str, port: int) -> bool:
    try:
        with socket.create_connection((ip, port), timeout=PORT_CONNECT_TIMEOUT_S):
            return True
    except OSError:
        return False


def _scan_ports(ips: list[str]) -> dict[str, list[int]]:
    """Best-effort TCP connect scan of SCAN_PORTS for each already-live
    host -- only run against hosts the ping/ARP sweep already found, not
    the whole range, so this stays fast and doesn't probe hosts that
    aren't even there."""
    open_ports: dict[str, list[int]] = {ip: [] for ip in ips}
    if not ips:
        return open_ports
    with concurrent.futures.ThreadPoolExecutor(max_workers=SWEEP_WORKERS) as pool:
        futures = {
            pool.submit(_check_port, ip, port): (ip, port)
            for ip in ips
            for port in SCAN_PORTS
        }
        for future in concurrent.futures.as_completed(futures):
            ip, port = futures[future]
            if future.result():
                open_ports[ip].append(port)
    for ports in open_ports.values():
        ports.sort()
    return open_ports


def _expand_hosts(cidr: str) -> list[str]:
    network = ipaddress.ip_network(cidr, strict=False)
    hosts = [str(ip) for ip in network.hosts()]
    if len(hosts) > MAX_HOSTS:
        log.warning(
            "CIDR %s has %d addresses -- capping sweep to first %d",
            cidr, len(hosts), MAX_HOSTS,
        )
        hosts = hosts[:MAX_HOSTS]
    return hosts


def scan_network(cidr: str) -> list[dict[str, Any]]:
    """Ping + ARP sweep of ``cidr``.

    ARP is the primary signal -- it finds hosts that answer link-layer
    even when they block ICMP (the actual trick network-discovery tools
    rely on). The ping sweep mostly exists to populate the ARP cache for
    hosts Windows hasn't talked to recently, on top of directly telling
    us who's alive right now.
    """
    hosts = _expand_hosts(cidr)
    network = ipaddress.ip_network(cidr, strict=False)

    responded: set[str] = set()
    with concurrent.futures.ThreadPoolExecutor(max_workers=SWEEP_WORKERS) as pool:
        futures = {pool.submit(_ping_once, ip): ip for ip in hosts}
        for future in concurrent.futures.as_completed(futures):
            if future.result():
                responded.add(futures[future])

    try:
        neighbors = run_powershell(_NEIGHBORS_PS, timeout=30) or []
    except Exception as err:  # noqa: BLE001
        log.warning("Get-NetNeighbor failed: %s -- falling back to ping-only results", err)
        neighbors = []
    if not isinstance(neighbors, list):
        neighbors = [neighbors]

    mac_by_ip: dict[str, str] = {}
    for entry in neighbors:
        ip, mac = entry.get("IPAddress"), entry.get("MAC")
        if not ip or not mac:
            continue
        try:
            in_range = ipaddress.ip_address(ip) in network
        except ValueError:
            continue
        if in_range:
            mac_by_ip[ip] = mac

    candidate_ips = sorted(responded | set(mac_by_ip.keys()), key=ipaddress.ip_address)
    hostnames = _resolve_hostnames(candidate_ips)
    open_ports = _scan_ports(candidate_ips)

    return [
        {
            "ip": ip,
            "mac": mac_by_ip.get(ip),
            "hostname": hostnames.get(ip),
            "respondedToPing": ip in responded,
            "openPorts": open_ports.get(ip, []),
        }
        for ip in candidate_ips
    ]
