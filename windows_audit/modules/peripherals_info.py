from utils.wmi_helper import get_wmi_connection
import wmi
from utils.powershell_helper import run_ps
import re

c = wmi.WMI()

def get_printers():
    cmd = "Get-Printer | Select Name,DriverName,PortName,Shared,Default,WorkOffline,PrinterStatus | ConvertTo-Json"
    printers = run_ps(cmd)
    return printers


def get_monitors():
    cmd = "Get-CimInstance -ClassName Win32_DesktopMonitor | Select Name,Status,DeviceID,PNPDeviceID,ScreenWidth,ScreenHeight | ConvertTo-Json"
    monitors = run_ps(cmd)
    return monitors


def get_keyboards():
    cmd = "Get-CimInstance -ClassName Win32_Keyboard | Select Name,Layout,Status,DeviceID,PNPDeviceID,NumberOfFunctionKeys,Manufacturer | ConvertTo-Json"
    keyboards = run_ps(cmd)
    return keyboards


def get_mice():
    # """Pobiera listę urządzeń wskazujących."""
    cmd = "Get-CimInstance -ClassName Win32_PointingDevice | Select Name,Status,NumberOfButtons,DeviceID,Manufacturer,PNPDeviceID,PointingType | ConvertTo-Json"
    mice = run_ps(cmd)
    return mice

def get_sound_devices():
    cmd_sound = """
    Get-CimInstance -ClassName Win32_SoundDevice |
    Select Name, Status, DeviceID, Manufacturer, ProductName, PNPDeviceID,
           PowerManagementSupported, PowerManagementCapabilities,
           Availability, Caption, Description, ConfigManagerErrorCode,
           ConfigManagerUserConfig, SystemName, CreationClassName,
           DriverVersion, StatusInfo |
    ConvertTo-Json
    """

    cmd_pnp = """
    Get-CimInstance -ClassName Win32_PnPEntity |
    Where-Object { $_.Name -match "Audio|Headset|Microphone|Headphones|Speakers" } |
    Select Name, Manufacturer, PNPDeviceID, Status, DeviceID, Description, Service, ClassGuid, ConfigManagerErrorCode |
    ConvertTo-Json
    """

    sound_devices = run_ps(cmd_sound)
    pnp_audio = run_ps(cmd_pnp)

    results = []

    # Prosta baza znanych producentów (możesz rozszerzyć)
    VENDOR_DB = {
        "0951": "Kingston (HyperX)",
        "046D": "Logitech",
        "04F2": "Chicony",
        "0BDA": "Realtek",
        "05AC": "Apple",
        "054C": "Sony",
        "045E": "Microsoft",
        "0D8C": "C-Media",
        "10F5": "Focusrite",
        "17EF": "Lenovo",
        "1A40": "Audio-Technica",
        "1B1C": "Corsair",
        "1395": "Blue Microphones",
    }

    def extract_vid_pid(pnp_id):
        """Wyciąga VID/PID z PNPDeviceID i próbuje określić model."""
        if not pnp_id:
            return None, None, None
        vid_match = re.search(r"VID_([0-9A-Fa-f]{4})", pnp_id)
        pid_match = re.search(r"PID_([0-9A-Fa-f]{4})", pnp_id)
        vid = vid_match.group(1).upper() if vid_match else None
        pid = pid_match.group(1).upper() if pid_match else None
        vendor = VENDOR_DB.get(vid, "Unknown Vendor")
        model_hint = f"VID_{vid}_PID_{pid}" if vid and pid else None
        return vid, pid, vendor if vendor else "Unknown", model_hint

    def normalize_entry(entry):
        vid, pid, vendor, model_hint = extract_vid_pid(entry.get("PNPDeviceID", ""))
        return {
            "name": entry.get("Name"),
            "manufacturer": entry.get("Manufacturer"),
            "vendor_detected": vendor,
            "status": entry.get("Status"),
            "product_name": entry.get("ProductName"),
            "description": entry.get("Description"),
            "caption": entry.get("Caption"),
            "system_name": entry.get("SystemName"),
            "driver_version": entry.get("DriverVersion"),
            "availability": entry.get("Availability"),
            "error_code": entry.get("ConfigManagerErrorCode"),
            "pnp_device_id": entry.get("PNPDeviceID"),
            "device_id": entry.get("DeviceID"),
            "vid": vid,
            "pid": pid,
            "model_hint": model_hint
        }

    # Normalizuj dane z Win32_SoundDevice
    if isinstance(sound_devices, list):
        for s in sound_devices:
            results.append(normalize_entry(s))
    elif sound_devices:
        results.append(normalize_entry(sound_devices))

    # Dodaj dane z Win32_PnPEntity (mikrofony, headsety)
    if isinstance(pnp_audio, list):
        for p in pnp_audio:
            results.append(normalize_entry(p))
    elif pnp_audio:
        results.append(normalize_entry(pnp_audio))

    return results


def get_usb_devices():
    """Pobiera listę urządzeń USB."""
    cmd = "Get-CimInstance -ClassName Win32_USBHub | Select Name | ConvertTo-Json"
    usb_devices = run_ps(cmd)
    return usb_devices


def get_external_drives():
    """Pobiera listę dysków zewnętrznych (removable)."""
    cmd = "Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object {$_.DriveType -eq 2} | Select DeviceID,VolumeName,FileSystem,FreeSpace,Size | ConvertTo-Json"
    drives = run_ps(cmd)
    return drives

def get_peripherals_info():
    data = {}
    try: 
        data = {
            "mice": get_mice(),
            "keyboards": get_keyboards(),
            "monitors": get_monitors(),
            "printers": get_printers(),
            "usb_devices": get_usb_devices(),
            "sound_devices": get_sound_devices(),
            "external_drives": get_external_drives()
        }
        return data
    except Exception as e:
        data['error'] = str(e)
    return data
