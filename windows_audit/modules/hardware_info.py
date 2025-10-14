import psutil
from utils.wmi_helper import get_wmi_connection


def get_hardware_info():
    c = get_wmi_connection()
    data = {}
    try:
        # CPU
        if c:
            cpu = c.Win32_Processor()[0]
            data['CPU'] = {
                'Name': cpu.Name.strip(),
                'Cores': int(cpu.NumberOfCores),
                'LogicalProcessors': int(cpu.NumberOfLogicalProcessors),
                'MaxClockSpeedMHz': int(cpu.MaxClockSpeed)
            }
        else:
            data['CPU'] = {'error': 'WMI unavailable'}

        # RAM
        mem = psutil.virtual_memory()
        data['RAM'] = {
            'TotalBytes': mem.total,
            'AvailableBytes': mem.available
        }

        # GPU
        if c:
            try:
                gpus = c.Win32_VideoController()
                data['GPU'] = [{'Name': g.Name, 'DriverVersion': g.DriverVersion} for g in gpus]
            except:
                data['GPU'] = []

        # Disks (physical)
        if c:
            disks = []
            for d in c.Win32_DiskDrive():
                try:
                    size = int(d.Size) if d.Size else None
                except:
                    size = None
                disks.append({'Model': d.Model, 'SerialNumber': getattr(d, 'SerialNumber', None), 'SizeBytes': size, 'InterfaceType': d.InterfaceType})
            data['PhysicalDisks'] = disks

        # Motherboard
        if c:
            try:
                mb = c.Win32_BaseBoard()[0]
                data['Motherboard'] = {'Manufacturer': mb.Manufacturer, 'Product': mb.Product, 'SerialNumber': getattr(mb, 'SerialNumber', None)}
            except:
                data['Motherboard'] = {}

    except Exception as e:
        data['error'] = str(e)
    return data