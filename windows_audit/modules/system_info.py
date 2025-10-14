import platform
import socket
import os
from utils.powershell_helper import run_ps


def get_system_info():
    data = {}
    try:
        data['platform'] = platform.platform()
        data['windows_release'] = platform.release()
        data['windows_version'] = platform.version()
        data['machine'] = platform.machine()
        data['processor'] = platform.processor()
        data['hostname'] = socket.gethostname()
        data['fqdn'] = socket.getfqdn()
        data['username'] = os.getlogin()

        # Windows specific: product name, install date
        prod = run_ps("Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture,SerialNumber | ConvertTo-Json")
        data['win_cim'] = prod

        # Time / NTP
        timecfg = run_ps("w32tm /query /status")
        data['time_sync'] = timecfg

    except Exception as e:
        data['error'] = str(e)
    return data