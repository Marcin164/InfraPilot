import psutil
from utils.powershell_helper import run_ps
import os

def get_disk_partitions():
    """Zwraca listę partycji z informacjami o systemie plików i zajętym miejscu."""
    parts = []
    for p in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(p.mountpoint)
        except Exception:
            usage = None
        parts.append({
            'device': p.device,
            'mountpoint': p.mountpoint,
            'fstype': p.fstype,
            'opts': p.opts,
            'usage': usage._asdict() if usage else None
        })
    return parts


def get_fragmentation():
    """Sprawdza poziom fragmentacji wszystkich dysków."""
    return run_ps('defrag /C /A')


def get_bad_sectors_info(drive_letter='C:'):
    """Sprawdza raport o bad sectorach przy użyciu chkdsk (tylko odczyt)."""
    cmd = f"chkdsk {drive_letter}"
    return run_ps(cmd)


def get_top_disk_usage(path='C:\\', top_n=50):
    """Zwraca największe pliki (rozmiar + ścieżka)."""
    results = []
    for root, dirs, files in os.walk(path):
        for f in files:
            try:
                fp = os.path.join(root, f)
                size = os.path.getsize(fp)
                results.append((size, fp))
            except Exception:
                pass
    results.sort(reverse=True)
    top = [{'path': p, 'size': s} for s, p in results[:top_n]]
    return top


def get_storage_info():
    """Agreguje wszystkie dane o magazynach danych."""
    data = {}
    try:
        data['partitions'] = get_disk_partitions()
        data['fragmentation'] = get_fragmentation()
        data['bad_sectors_sample'] = get_bad_sectors_info('C:')
        data['top_disk_usage'] = get_top_disk_usage('C:\\', top_n=50)
    except Exception as e:
        data['error'] = str(e)
    return data
