from utils.powershell_helper import run_ps

def get_power_and_performance():
    """Zbiera informacje o zasilaniu, defragmentacji i zadaniach."""
    data = {}
    try:
        # Dostępne plany zasilania
        data['power_plans'] = run_ps('powercfg /list')

        # Ustawienia bieżącego planu zasilania
        data['power_settings'] = run_ps('powercfg /query')

        # Zaplanowana defragmentacja (Windows Task Scheduler)
        data['scheduled_defrag'] = run_ps('schtasks /Query /FO LIST /V | findstr /I defrag')

        # Wszystkie zaplanowane zadania
        data['scheduled_tasks'] = run_ps('Get-ScheduledTask | ConvertTo-Json')

    except Exception as e:
        data['error'] = str(e)
    return data
