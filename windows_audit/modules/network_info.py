import psutil
import subprocess
from utils.powershell_helper import run_ps


def parse_net_use():
    out = run_ps("net use")
    return out


def get_network_info():
    data = {}
    try:
        # Adapters and addresses
        if_addrs = psutil.net_if_addrs()
        interfaces = {}
        for name, addrs in if_addrs.items():
            interfaces[name] = []
            for a in addrs:
                interfaces[name].append({'family': str(a.family), 'address': a.address, 'netmask': a.netmask, 'broadcast': a.broadcast})
        data['adapters'] = interfaces

        # Active connections
        cons = []
        for c in psutil.net_connections(kind='inet'):
            laddr = f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else None
            raddr = f"{c.raddr.ip}:{c.raddr.port}" if c.raddr else None
            cons.append({'pid': c.pid, 'laddr': laddr, 'raddr': raddr, 'status': c.status})
        data['connections'] = cons

        # Mapped network drives
        data['mapped_drives'] = parse_net_use()

        # Network shares (server-side): net share
        data['shares'] = run_ps('Get-SmbShare | Select Name,Path,Description | ConvertTo-Json')

        # Firewall rules
        data['firewall_rules'] = run_ps('Get-NetFirewallRule | Select Name,DisplayName,Enabled,Profile,Direction,Action | ConvertTo-Json')

        # NIC configuration
        data['nic_config'] = run_ps("Get-NetIPConfiguration | ConvertTo-Json")

    except Exception as e:
        data['error'] = str(e)
    return data