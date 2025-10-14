import subprocess
from utils.powershell_helper import run_ps


def get_installed_programs():
    cmd = "Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* , HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName,DisplayVersion,Publisher,InstallDate | ConvertTo-Json"
    out = run_ps(cmd)
    return out


def get_appx_packages():
    return run_ps("Get-AppxPackage | Select Name, PackageFullName | ConvertTo-Json")


def get_windows_features():
    return run_ps("Get-WindowsOptionalFeature -Online | Select FeatureName,State | ConvertTo-Json")


def get_software_info():
    data = {}
    try:
        data['installed_programs'] = get_installed_programs()
        data['appx_packages'] = get_appx_packages()
        data['windows_features'] = get_windows_features()

        # System info from c:
        sysinfo = run_ps("Get-CimInstance -ClassName Win32_OperatingSystem | Select Caption,OSArchitecture,Version,BuildNumber | ConvertTo-Json")
        data['os_details'] = sysinfo

    except Exception as e:
        data['error'] = str(e)
    return data