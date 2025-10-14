from utils.powershell_helper import run_ps

def get_certificates():
    # Certyfikaty w magazynie lokalnym i użytkownika
    certs_local = run_ps("certutil -store My")
    certs_user = run_ps("certutil -user -store My")
    return {'local_store': certs_local, 'user_store': certs_user}


def get_tpm_info():
    # Informacje o module TPM
    return run_ps("Get-WmiObject -Namespace root\\cimv2\\security\\microsofttpm -Class Win32_Tpm | ConvertTo-Json")


def get_bitlocker_info():
    # Status szyfrowania dysków
    return run_ps("manage-bde -status")


def get_secpol():
    # Eksport zasad bezpieczeństwa lokalnych (secpol.msc)
    out = run_ps("secedit /export /cfg C:\\Windows\\Temp\\secpol.cfg && Get-Content C:\\Windows\\Temp\\secpol.cfg -Raw")
    return out


def get_security_info():
    data = {}
    try:
        data['certificates'] = get_certificates()
        data['tpm'] = get_tpm_info()
        data['bitlocker'] = get_bitlocker_info()
        data['secpol'] = get_secpol()

        # Zainstalowane antywirusy (Windows Security Center)
        data['antivirus'] = run_ps(
            'Get-CimInstance -Namespace root\\SecurityCenter2 -ClassName AntiVirusProduct '
            '| Select displayName,productState,pathToSignedProductExe,instanceGuid | ConvertTo-Json'
        )

        # Status RDP (czy włączone połączenia zdalne)
        data['rdp_status'] = run_ps(
            "Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server' "
            "-Name fDenyTSConnections | ConvertTo-Json"
        )

        # Windows Hello (biometria, jeśli dostępna)
        data['windows_hello'] = run_ps("Get-WindowsBiometric -ErrorAction SilentlyContinue | ConvertTo-Json")

        # Ustawienia profilu zapory
        data['firewall_profile'] = run_ps(
            'Get-NetFirewallProfile | Select Name,Enabled,DefaultInboundAction,DefaultOutboundAction | ConvertTo-Json'
        )

    except Exception as e:
        data['error'] = str(e)
    return data