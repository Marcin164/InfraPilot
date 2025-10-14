from utils.wmi_helper import get_wmi_connection
from utils.powershell_helper import run_ps

def get_printers():
    # Lista drukarek lokalnych i sieciowych
    return run_ps("Get-Printer | Select Name,DriverName,PortName,Shared | ConvertTo-Json")

def get_peripherals_info():
    c = get_wmi_connection()
    data = {}
    try:
        # Urządzenia USB
        if c:
            usb = []
            for d in c.Win32_USBControllerDevice():
                try:
                    usb.append(str(d.Dependent))
                except:
                    pass
            data['usb_devices'] = usb

        # Drukarki
        data['printers'] = get_printers()

        # Urządzenia audio
        data['audio'] = run_ps("Get-CimInstance -ClassName Win32_SoundDevice | Select Name,Status | ConvertTo-Json")

        # Monitory
        data['monitors'] = run_ps("Get-CimInstance -Namespace root\\wmi -ClassName WmiMonitorID | ConvertTo-Json")

    except Exception as e:
        data['error'] = str(e)
    return data
