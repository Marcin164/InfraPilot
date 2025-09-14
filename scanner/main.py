import platform
import socket
import os
import subprocess
import datetime
import psutil
import cpuinfo
import wmi
import getpass
import winreg
import json
import requests

def get_system_info():
    try:
        install_date = None
        if platform.system() == "Windows":
            output = subprocess.check_output("systeminfo", shell=True, universal_newlines=True, encoding='mbcs')
            for line in output.splitlines():
                if "Original Install Date" in line:
                    install_date = line.split(":")[1].strip()

        boot_time_timestamp = os.path.getctime('C:\\')
        boot_time = datetime.datetime.fromtimestamp(boot_time_timestamp).isoformat()

        uname = platform.uname()

        return {
            "system_name": platform.system(),
            "system_version": platform.version(),
            "system_release": platform.release(),
            "system_build": platform.win32_ver()[1],
            "architecture": platform.machine(),
            "hostname": socket.gethostname(),
            "node_name": uname.node,
            "processor": uname.processor,
            "platform": uname.system,
            "platform_version": uname.version,
            "install_date": install_date,
            "boot_time": boot_time,
            "cpu_count_logical": psutil.cpu_count(logical=True),
            "cpu_count_physical": psutil.cpu_count(logical=False),
            "memory_total": psutil.virtual_memory().total,
            "swap_total": psutil.swap_memory().total,
            "python_version": platform.python_version()
        }
    except Exception as e:
        return {"error": str(e)}

def get_hardware_info():
    try:
        c = wmi.WMI()

        # CPU
        cpu = []
        for p in c.Win32_Processor():
            cpu.append({
                "name": getattr(p, "Name", None),
                "manufacturer": getattr(p, "Manufacturer", None),
                "processor_id": getattr(p, "ProcessorId", None),
                "architecture": getattr(p, "Architecture", None),
                "caption": getattr(p, "Caption", None),
                "socket": getattr(p, "SocketDesignation", None),
                "cores": getattr(p, "NumberOfCores", None),
                "threads": getattr(p, "NumberOfLogicalProcessors", None),
                "l2_cache": getattr(p, "L2CacheSize", None),
                "l3_cache": getattr(p, "L3CacheSize", None),
                "max_clock_speed": getattr(p, "MaxClockSpeed", None),
                "current_clock_speed": getattr(p, "CurrentClockSpeed", None)
            })

        # RAM modules
        ram_modules = []
        for m in c.Win32_PhysicalMemory():
            ram_modules.append({
                "capacity": getattr(m, "Capacity", None),
                "speed": getattr(m, "Speed", None),
                "manufacturer": getattr(m, "Manufacturer", None),
                "part_number": getattr(m, "PartNumber", None),
                "serial_number": getattr(m, "SerialNumber", None),
                "bank_label": getattr(m, "BankLabel", None),
                "device_locator": getattr(m, "DeviceLocator", None)
            })

        # Disks & partitions
        disks = []
        for d in c.Win32_DiskDrive():
            partitions = []
            for p in d.associators("Win32_DiskDriveToDiskPartition"):
                for ld in p.associators("Win32_LogicalDiskToPartition"):
                    try:
                        total = int(getattr(ld, "Size", 0)) if getattr(ld, "Size", None) else None
                        free = int(getattr(ld, "FreeSpace", 0)) if getattr(ld, "FreeSpace", None) else None
                        used = total - free if total is not None and free is not None else None

                        partitions.append({
                            "device_id": getattr(ld, "DeviceID", None),
                            "volume_name": getattr(ld, "VolumeName", None),
                            "file_system": getattr(ld, "FileSystem", None),
                            "total_size": total,
                            "free_space": free,
                            "used_space": used
                        })
                    except Exception:
                        continue

            disks.append({
                "model": getattr(d, "Model", None),
                "serial_number": getattr(d, "SerialNumber", None),
                "size": getattr(d, "Size", None),
                "interface_type": getattr(d, "InterfaceType", None),
                "media_type": getattr(d, "MediaType", None),
                "pnp_device_id": getattr(d, "PNPDeviceID", None),
                "partitions": partitions
            })

        # GPU
        gpus = []
        for g in c.Win32_VideoController():
            gpus.append({
                "name": getattr(g, "Name", None),
                "driver_version": getattr(g, "DriverVersion", None),
                "adapter_ram": getattr(g, "AdapterRAM", None),
                "video_processor": getattr(g, "VideoProcessor", None),
                "pnp_device_id": getattr(g, "PNPDeviceID", None),
                "current_resolution": f"{getattr(g, 'CurrentHorizontalResolution', '')}x{getattr(g, 'CurrentVerticalResolution', '')}",
                "max_refresh_rate": getattr(g, "MaxRefreshRate", None)
            })

        # Baseboard
        baseboard = c.Win32_BaseBoard()[0]

        # BIOS
        bios = c.Win32_BIOS()[0]

        # Battery
        batteries = []
        for b in c.Win32_Battery():
            batteries.append({
                "name": getattr(b, "Name", None),
                "status": getattr(b, "BatteryStatus", None),
                "charge_remaining": getattr(b, "EstimatedChargeRemaining", None),
                "chemistry": getattr(b, "Chemistry", None),
                "design_capacity": getattr(b, "DesignCapacity", None),
                "full_charge_capacity": getattr(b, "FullChargeCapacity", None)
            })

        return {
            "cpu": cpu,
            "ram_modules": ram_modules,
            "disks": disks,
            "gpus": gpus,
            "baseboard": {
                "manufacturer": getattr(baseboard, "Manufacturer", None),
                "product": getattr(baseboard, "Product", None),
                "serial_number": getattr(baseboard, "SerialNumber", None),
                "version": getattr(baseboard, "Version", None),
                "asset_tag": getattr(baseboard, "AssetTag", None),
                "hosting_board": getattr(baseboard, "HostingBoard", None),
                "powered_on": getattr(baseboard, "PoweredOn", None)
            },
            "bios": {
                "manufacturer": getattr(bios, "Manufacturer", None),
                "version": getattr(bios, "SMBIOSBIOSVersion", None),
                "serial_number": getattr(bios, "SerialNumber", None),
                "release_date": getattr(bios, "ReleaseDate", None),
                "bios_tag": getattr(bios, "SMBIOSAssetTag", None),
                "smbios_major": getattr(bios, "SMBIOSMajorVersion", None),
                "smbios_minor": getattr(bios, "SMBIOSMinorVersion", None)
            },
            "batteries": batteries,
        }
    except Exception as e:
        return {"error": str(e)}


def get_network_info():
    try:
        info = {}

        # Interfejsy sieciowe i adresy
        addrs = psutil.net_if_addrs()
        info["interfaces"] = {}
        for iface, addr_list in addrs.items():
            info["interfaces"][iface] = []
            for addr in addr_list:
                info["interfaces"][iface].append({
                    "family": str(addr.family),
                    "address": addr.address,
                    "netmask": addr.netmask,
                    "broadcast": addr.broadcast,
                    "ptp": addr.ptp
                })

        # Statystyki sieciowe
        stats = psutil.net_if_stats()
        info["stats"] = {}
        for iface, st in stats.items():
            info["stats"][iface] = {
                "is_up": st.isup,
                "duplex": st.duplex,
                "speed_mbps": st.speed,
                "mtu": st.mtu
            }

        # Połączenia aktywne
        connections = psutil.net_connections(kind='inet')
        info["connections"] = []
        for c in connections:
            info["connections"].append({
                "fd": c.fd,
                "family": str(c.family),
                "type": str(c.type),
                "laddr": f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else None,
                "raddr": f"{c.raddr.ip}:{c.raddr.port}" if c.raddr else None,
                "status": c.status,
                "pid": c.pid
            })

        # Nazwa domeny / hosta / FQDN
        info["fqdn"] = socket.getfqdn()
        info["default_gateway"] = None
        try:
            route_output = subprocess.check_output("ipconfig", shell=True, text=True, encoding='mbcs')
            for line in route_output.splitlines():
                if "Default Gateway" in line:
                    gw = line.split(":")[-1].strip()
                    if gw:
                        info["default_gateway"] = gw
                        break
        except Exception:
            pass

        return info
    except Exception as e:
        return {"error": str(e)}

def get_users_info():
    try:
        current_user = getpass.getuser()

        # Pobieranie listy wszystkich użytkowników
        users_output = subprocess.check_output(
            "net user", shell=True, text=True, encoding='mbcs'
        )
        user_lines = users_output.splitlines()
        users = []
        capture = False
        for line in user_lines:
            if "----------" in line:
                capture = not capture
                continue
            if capture:
                users.extend(line.strip().split())

        # Szukanie nazwy grupy administratorów (zależnie od języka systemu)
        group_name = None
        try:
            localized_output = subprocess.check_output(
                'net localgroup', shell=True, text=True, encoding='mbcs'
            )
            for line in localized_output.splitlines():
                line = line.strip()
                if line.lower().startswith("admin"):
                    group_name = line
                    break
                if "admin" in line.lower():
                    group_name = line
                    break
        except Exception:
            pass

        if not group_name:
            # fallback na typowe nazwy
            for candidate in ["Administrators", "Administratorzy"]:
                try:
                    subprocess.check_output(
                        f'net localgroup "{candidate}"',
                        shell=True, text=True, encoding='mbcs'
                    )
                    group_name = candidate
                    break
                except Exception:
                    continue

        # Pobranie użytkowników należących do grupy administratorów
        admin_users = []
        if group_name:
            admin_output = subprocess.check_output(
                f'net localgroup "{group_name}"',
                shell=True, text=True, encoding='mbcs'
            )
            capture = False
            for line in admin_output.splitlines():
                if "----------" in line:
                    capture = True
                    continue
                if capture and line.strip():
                    admin_users.append(line.strip())

        return {
            "current_user": current_user,
            "all_users": users,
            "admin_users": admin_users
        }
    except Exception as e:
        return {"error": str(e)}


def has_reg_value(subkey, name):
    try:
        winreg.QueryValueEx(subkey, name)
        return True
    except FileNotFoundError:
        return False


def get_installed_software():
    try:
        software_list = []

        reg_paths = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall")
        ]

        for hive, path in reg_paths:
            try:
                reg_key = winreg.OpenKey(hive, path)
                for i in range(0, winreg.QueryInfoKey(reg_key)[0]):
                    subkey_name = winreg.EnumKey(reg_key, i)
                    subkey = winreg.OpenKey(reg_key, subkey_name)
                    try:
                        name = winreg.QueryValueEx(subkey, "DisplayName")[0]
                        version = winreg.QueryValueEx(subkey, "DisplayVersion")[0] if has_reg_value(subkey, "DisplayVersion") else None
                        publisher = winreg.QueryValueEx(subkey, "Publisher")[0] if has_reg_value(subkey, "Publisher") else None
                        install_date = winreg.QueryValueEx(subkey, "InstallDate")[0] if has_reg_value(subkey, "InstallDate") else None
                        software_list.append({
                            "name": name,
                            "version": version,
                            "publisher": publisher,
                            "install_date": install_date
                        })
                    except Exception:
                        continue
            except Exception:
                continue

        return software_list
    except Exception as e:
        return {"error": str(e)}


def get_security_info():
    try:
        c = wmi.WMI(namespace='root\\SecurityCenter2')

        # Antywirusy
        antiviruses = [{
            "name": getattr(av, "displayName", None),
            "path_to_exe": getattr(av, "pathToSignedProductExe", None),
            "state": getattr(av, "productState", None)
        } for av in c.AntiVirusProduct()]

        # Firewall jako obiekt
        firewall_status = {}
        try:
            fw_output = subprocess.check_output(
                "netsh advfirewall show allprofiles",
                shell=True, text=True, encoding='mbcs'
            )
            current_profile = None
            for line in fw_output.splitlines():
                if "Profile Settings" in line:
                    current_profile = line.split()[0]
                    firewall_status[current_profile] = {}
                elif ":" in line and current_profile:
                    key, value = line.split(":", 1)
                    firewall_status[current_profile][key.strip()] = value.strip()
        except Exception:
            firewall_status = {"status": "Unknown"}

        # Aktualizacje
        updates = []
        try:
            for qfe in wmi.WMI().Win32_QuickFixEngineering():
                updates.append({
                    "hotfix_id": getattr(qfe, "HotFixID", None),
                    "description": getattr(qfe, "Description", None),
                    "installed_on": getattr(qfe, "InstalledOn", None)
                })
        except Exception:
            pass

        # BitLocker
        bitlocker_status = {}
        try:
            output = subprocess.check_output("manage-bde -status", shell=True, text=True, encoding='mbcs')
            current_volume = None
            for line in output.splitlines():
                if "Volume" in line:
                    current_volume = line.split()[0]
                    bitlocker_status[current_volume] = {}
                elif ":" in line and current_volume:
                    key, value = line.split(":", 1)
                    bitlocker_status[current_volume][key.strip()] = value.strip()
        except Exception:
            bitlocker_status = {"status": "Unknown"}

        # Mapowanie password policy -> EN
        mapping = {
            "Minimalny okres ważności hasła (dni)": "Minimum password age (days)",
            "Maksymalny okres ważności hasła (dni)": "Maximum password age (days)",
            "Minimalna długość hasła": "Minimum password length",
            "Długość zapamiętanej historii haseł": "Password history length",
            "Po jakim czasie od wygaśnięcia czasu wymusza wylogowanie?": "Force logoff after expiration",
            "Próg blokady": "Lockout threshold",
            "Czas trwania blokady (minuty)": "Lockout duration (minutes)",
            "Okno obserwowania blokady (minuty)": "Lockout observation window (minutes)",
            "Rola komputera": "Computer role"
        }

        password_policy = {}
        try:
            output = subprocess.check_output("net accounts", shell=True, text=True, encoding='mbcs')
            for line in output.splitlines():
                if ":" in line:
                    key, value = line.split(":", 1)
                    key_clean = key.strip()
                    eng_key = mapping.get(key_clean, key_clean)
                    password_policy[eng_key] = value.strip()
        except Exception:
            password_policy = {"status": "Unknown"}

        # UAC status
        uac_status = {}
        try:
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                                 r"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System")
            enable_lua = winreg.QueryValueEx(key, "EnableLUA")[0]
            consent_prompt = winreg.QueryValueEx(key, "ConsentPromptBehaviorAdmin")[0]
            secure_desktop = winreg.QueryValueEx(key, "PromptOnSecureDesktop")[0]
            uac_status = {
                "enabled": enable_lua == 1,
                "consent_prompt_behavior_admin": consent_prompt,
                "secure_desktop_prompt": secure_desktop
            }
        except Exception:
            uac_status = {"status": "Unknown"}

        # RDP status
        rdp_status = {}
        try:
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                                 r"SYSTEM\\CurrentControlSet\\Control\\Terminal Server")
            deny_ts = winreg.QueryValueEx(key, "fDenyTSConnections")[0]
            rdp_status["enabled"] = False if deny_ts == 1 else True
            try:
                nla_key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                                         r"SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp")
                nla_value = winreg.QueryValueEx(nla_key, "UserAuthentication")[0]
                rdp_status["network_level_auth"] = (nla_value == 1)
            except Exception:
                rdp_status["network_level_auth"] = "Unknown"
        except Exception:
            rdp_status = {"status": "Unknown"}

        # Programy startowe
        startup_apps = []
        try:
            for s in wmi.WMI().Win32_StartupCommand():
                startup_apps.append({
                    "name": getattr(s, "Name", None),
                    "command": getattr(s, "Command", None),
                    "location": getattr(s, "Location", None)
                })
        except Exception:
            pass

        return {
            "antivirus": antiviruses,
            "firewall": firewall_status,
            "updates": updates,
            "bitlocker": bitlocker_status,
            "password_policy": password_policy,
            "uac_status": uac_status,
            "rdp_status": rdp_status,
            "startup_apps": startup_apps
        }
    except Exception as e:
        return {"error": str(e)}

def get_peripherals_info():
    try:
        c = wmi.WMI()

        usb_devices = [str(device.Dependent.Name) for device in c.Win32_USBControllerDevice() if hasattr(device.Dependent, 'Name')]

        keyboards = [{
            "name": getattr(kb, "Name", None),
            "manufacturer": getattr(kb, "Manufacturer", None),
            "device_id": getattr(kb, "DeviceID", None),
            "pnp_device_id": getattr(kb, "PNPDeviceID", None),
            "layout": getattr(kb, "Layout", None),
            "function_keys": getattr(kb, "NumberOfFunctionKeys", None),
            "status": getattr(kb, "Status", None)
        } for kb in c.Win32_Keyboard()]

        mice = [{
            "name": getattr(m, "Name", None),
            "manufacturer": getattr(m, "Manufacturer", None),
            "device_id": getattr(m, "DeviceID", None),
            "pnp_device_id": getattr(m, "PNPDeviceID", None),
            "hardware_type": getattr(m, "HardwareType", None),
            "buttons": getattr(m, "NumberOfButtons", None),
            "pointing_type": getattr(m, "PointingType", None),
            "status": getattr(m, "Status", None)
        } for m in c.Win32_PointingDevice()]

        printers = [{
            "name": getattr(p, "Name", None),
            "driver": getattr(p, "DriverName", None),
            "port": getattr(p, "PortName", None),
            "device_id": getattr(p, "DeviceID", None),
            "pnp_device_id": getattr(p, "PNPDeviceID", None),
            "default": getattr(p, "Default", None),
            "shared": getattr(p, "Shared", None),
            "work_offline": getattr(p, "WorkOffline", None),
            "status": getattr(p, "Status", None)
        } for p in c.Win32_Printer()]

        sound_devices = [{
            "name": getattr(s, "Name", None),
            "manufacturer": getattr(s, "Manufacturer", None),
            "device_id": getattr(s, "DeviceID", None),
            "pnp_device_id": getattr(s, "PNPDeviceID", None),
            "product_name": getattr(s, "ProductName", None),
            "status": getattr(s, "Status", None)
        } for s in c.Win32_SoundDevice()]

        monitors = [{
            "name": getattr(m, "Name", None),
            "device_id": getattr(m, "DeviceID", None),
            "pnp_device_id": getattr(m, "PNPDeviceID", None),
            "screen_height": getattr(m, "ScreenHeight", None),
            "screen_width": getattr(m, "ScreenWidth", None),
            "status": getattr(m, "Status", None)
        } for m in c.Win32_DesktopMonitor()]

        external_drives = [{
            "model": getattr(d, "Model", None),
            "device_id": getattr(d, "DeviceID", None),
            "pnp_device_id": getattr(d, "PNPDeviceID", None),
            "serial_number": getattr(d, "SerialNumber", None),
            "interface_type": getattr(d, "InterfaceType", None),
            "size_bytes": getattr(d, "Size", None)
        } for d in c.Win32_DiskDrive() if getattr(d, "InterfaceType", None) == "USB"]

        return {
            "usb_devices": usb_devices,
            "keyboards": keyboards,
            "mice": mice,
            "printers": printers,
            "sound_devices": sound_devices,
            "monitors": monitors,
            "external_drives": external_drives
        }
    except Exception as e:
        return {"error": str(e)}
    
def send_data_to_server(data, url="http://localhost:3000/devices/agent/data"):
    try:
        response = requests.post(url, json=data, timeout=10)
        if response.status_code == 200:
            print("[INFO] Data successfully sent to server.")
        else:
            print(f"[WARN] Server returned status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[ERROR] Failed to send data: {e}")

def main():
    print("[INFO] Starting full agent scan...")

    system_info = get_system_info()
    hardware_info = get_hardware_info()
    network_info = get_network_info()
    users_info = get_users_info()
    software_info = get_installed_software()
    security_info = get_security_info()
    peripherals_info = get_peripherals_info()

    collected_data = {
        "idDevice": 2, 
        "system_info": system_info,
        "hardware_info": hardware_info,
        "network_info": network_info,
        "users_info": users_info,
        "software_info": software_info,
        "security_info": security_info,
        "peripherals_info": peripherals_info
    }

    print("[DEBUG] Full collected data:")
    with open("scan_result.json", "w", encoding="utf-8") as f:
        json.dump(collected_data, f, indent=2, ensure_ascii=False)

    print("[INFO] Full collected data saved to scan_result.json")

    # Wyślij na serwer NestJS
    send_data_to_server(collected_data)

if __name__ == "__main__":
    main()
