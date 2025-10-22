from utils.powershell_helper import run_ps
import json

def get_installed_programs():
    cmd = "Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* , HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName,DisplayVersion,Publisher,InstallDate,InstallLocation,EstimatedSize | ConvertTo-Json"
    out = run_ps(cmd)
    return json.loads(out)


def get_appx_packages():
    cmd = "Get-AppxPackage | Select Name,PackageFullName,Publisher,Architecture,Version,InstallLocation,IsFramework | ConvertTo-Json"
    out = run_ps(cmd)
    return json.loads(out)


def get_windows_features():
    cmd = run_ps("Get-WindowsOptionalFeature -Online | Select FeatureName,State,Path,Online,LogPath | ConvertTo-Json")
    out = run_ps(cmd)
    return json.loads(out)

def get_software_info():
    data = {}
    try:
        data['installed_programs'] = get_installed_programs()
        data['appx_packages'] = get_appx_packages()
        data['windows_features'] = get_windows_features()

    except Exception as e:
        data['error'] = str(e)
    return data