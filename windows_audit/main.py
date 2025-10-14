import json
from modules.system_info import get_system_info
from modules.hardware_info import get_hardware_info
from modules.software_info import get_software_info
from modules.network_info import get_network_info
from modules.security_info import get_security_info
from modules.events_info import get_events_info
from modules.users_and_groups import get_users_and_groups_info
from modules.peripherals_info import get_peripherals_info
from modules.storage_info import get_storage_info
from modules.power_performance import get_power_and_performance

def main():
    audit = {
        "systemInfo": get_system_info(),
        "hardwareInfo": get_hardware_info(),
        "softwareInfo": get_software_info(),
        "networkInfo": get_network_info(),
        "securityInfo": get_security_info(),
        "eventsInfo": get_events_info(),
        "usersAndGroupsInfo": get_users_and_groups_info(),
        "peripheralsInfo": get_peripherals_info(),
        "storageInfo": get_storage_info(),
        "powerAndPerformance": get_power_and_performance(),
    }

    with open("system_audit.json", "w", encoding="utf-8") as f:
        json.dump(audit, f, indent=4, ensure_ascii=False)

    print("✅ Audyt systemu zapisany do pliku system_audit.json")

if __name__ == "__main__":
    main()