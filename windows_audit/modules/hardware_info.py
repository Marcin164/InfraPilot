import wmi
import os
from utils.powershell_helper import run_ps
from utils.wmi_helper import get_wmi_connection

def get_fragmentation():
    """Sprawdza poziom fragmentacji wszystkich dysków."""
    return run_ps('defrag /C /A')

def get_bad_sectors_info(drive_letter='C:'):
    """Sprawdza raport o bad sectorach przy użyciu chkdsk (tylko odczyt)."""
    cmd = f"chkdsk {drive_letter}"
    return run_ps(cmd)

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
                            "volume_serial_number": getattr(ld, "VolumeSerialNumber", None),
                            "total_size": total,
                            "free_space": free,
                            "used_space": used,
                            "fragmentation": get_fragmentation(),
                            "bad_sectors": get_bad_sectors_info(ld.Name)
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