import platform
import socket
import os
import subprocess
import datetime
from utils.powershell_helper import run_ps


def get_system_info():
    data = {}
    try:    
        install_date = None 
        if platform.system() == "Windows":
            output = subprocess.check_output("systeminfo", shell=True, universal_newlines=True, encoding='mbcs')
            for line in output.splitlines():
                if "Original Install Date" in line:
                    install_date = line.split(":")[1].strip()

        boot_time_timestamp = os.path.getctime('C:\\')
        boot_time = datetime.datetime.fromtimestamp(boot_time_timestamp).isoformat()

        data['platform'] = platform.platform()
        data['windows_release'] = platform.release()
        data['windows_version'] = platform.version()
        data["windows_build"] = platform.win32_ver()
        data['machine'] = platform.machine()
        data['processor'] = platform.processor()
        data['hostname'] = socket.gethostname()
        data['fqdn'] = socket.getfqdn()
        data['username'] = os.getlogin()
        data['architecture'] = platform.architecture()
        data['system'] = platform.system()
        data['python'] = platform.python_version()
        data['java'] = platform.java_ver()
        data['install_date'] = install_date
        data['boot_time'] = boot_time
        data['power_plans'] = run_ps('powercfg /list')
        data['power_settings'] = run_ps('powercfg /query')
        data['win_cim'] = run_ps("Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture,SerialNumber | ConvertTo-Json")
        data['time_sync'] = run_ps("w32tm /query /status")
        data['scheduled_tasks'] = run_ps('Get-ScheduledTask | ConvertTo-Json')

    except Exception as e:
        data['error'] = str(e)
    return data