from utils.powershell_helper import run_ps

def get_local_users():
    # Lista lokalnych użytkowników
    return run_ps("Get-LocalUser | Select Name,Enabled,LastLogon | ConvertTo-Json")

def get_local_groups():
    # Lista lokalnych grup
    return run_ps("Get-LocalGroup | ConvertTo-Json")

def get_user_profiles():
    # Profile użytkowników (ścieżki, SID, ostatnie logowanie)
    return run_ps("Get-CimInstance -ClassName Win32_UserProfile | Select LocalPath,SID,LastUseTime | ConvertTo-Json")

def get_active_directory_info():
    # Informacje o domenie, komputerze i użytkowniku z AD (wymaga RSAT)
    domain = run_ps("Get-ADDomain -ErrorAction SilentlyContinue | Select Name,Forest,DomainMode | ConvertTo-Json")
    comp = run_ps("Get-ADComputer -Identity $env:COMPUTERNAME -Properties DistinguishedName,OperatingSystem "
                  "| Select Name,DistinguishedName,OperatingSystem | ConvertTo-Json")
    user = run_ps("Get-ADUser -Identity $env:USERNAME -Properties DistinguishedName "
                  "| Select Name,DistinguishedName | ConvertTo-Json")
    return {'domain': domain, 'computer': comp, 'user': user}

def get_users_and_groups_info():
    data = {}
    try:
        data['local_users'] = get_local_users()
        data['local_groups'] = get_local_groups()
        data['user_profiles'] = get_user_profiles()
        data['active_directory'] = get_active_directory_info()
    except Exception as e:
        data['error'] = str(e)
    return data
