from utils.powershell_helper import run_ps
import json
import wmi

def get_certificates():
    # Certyfikaty w magazynie lokalnym i użytkownika
    certs_local = run_ps("certutil -store My")
    certs_user = run_ps("certutil -user -store My")
    return {'local_store': certs_local, 'user_store': certs_user}

def get_tpm_info():
    # Informacje o module TPM
    return run_ps("Get-WmiObject -Namespace root\CIMV2\Security\MicrosoftTpm -Class Win32_Tpm | ConvertTo-Json")

def get_bitlocker_info():
    # Status szyfrowania dysków
    return run_ps("Get-BitLockerVolume | ConvertTo-Json -Depth 3")

def get_secpol():
    # Eksport zasad bezpieczeństwa lokalnych (secpol.msc)
    out = run_ps("secedit /export /cfg C:\\Windows\\Temp\\secpol.cfg && Get-Content C:\\Windows\\Temp\\secpol.cfg -Raw")
    return out

def get_antivirus():
    cmd = "Get-CimInstance -Namespace root\\SecurityCenter2 -ClassName AntiVirusProduct| Select displayName,productState,pathToSignedProductExe,instanceGuid | ConvertTo-Json"
    out = run_ps(cmd)
    return json.loads(out)

def get_updates():
    updates = []
    for qfe in wmi.WMI().Win32_QuickFixEngineering():
        updates.append({
            "hotfix_id": getattr(qfe, "HotFixID", None),
            "description": getattr(qfe, "Description", None),
            "installed_on": getattr(qfe, "InstalledOn", None)
        })
    return updates

def get_security_info():
    data = {}
    try:
        data['certificates'] = get_certificates()
        data['tpm'] = get_tpm_info()
        data['bitlocker'] = get_bitlocker_info()
        data['secpol'] = get_secpol()
        data['antivirus'] = get_antivirus()
        data['rdp_status'] = run_ps("[pscustomobject]@{ RDP_Enabled = ((Get-ItemPropertyValue -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server' -Name fDenyTSConnections) -eq 0) } | ConvertTo-Json")
        data['windows_hello'] = run_ps("Get-WindowsBiometric -ErrorAction SilentlyContinue | ConvertTo-Json")
        data['firewall_profile'] = run_ps(
            'Get-NetFirewallProfile | Select Name,Enabled,DefaultInboundAction,DefaultOutboundAction | ConvertTo-Json'
        )
        data['updates'] = get_updates()

    except Exception as e:
        data['error'] = str(e)
    return data