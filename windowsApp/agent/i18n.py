"""Minimal UI string table for the GUI -- Polish (default) / English.

Deliberately not a full i18n framework (no plural rules, no locale
detection) -- this is a two-language toggle for a single-window admin
tool, not a product with translators. Values with ``{placeholders}`` are
filled in via ``Translator.t(key, **kwargs)``.
"""

from __future__ import annotations

LANG_PL = "pl"
LANG_EN = "en"
LANGUAGES = (LANG_PL, LANG_EN)

_STRINGS: dict[str, dict[str, str]] = {
    "nav.home": {"pl": "Start", "en": "Home"},
    "nav.connection": {"pl": "Połączenie", "en": "Connection"},
    "nav.scan": {"pl": "Skanowanie", "en": "Scan"},
    "nav.logs": {"pl": "Dziennik", "en": "Logs"},

    "home.title": {"pl": "Szybki podgląd hosta", "en": "Quick host overview"},
    "home.hostname": {"pl": "Hostname:", "en": "Hostname:"},
    "home.username": {"pl": "Użytkownik:", "en": "User:"},
    "home.ipv4": {"pl": "IPv4:", "en": "IPv4:"},
    "home.ipv6": {"pl": "IPv6:", "en": "IPv6:"},
    "home.gateway": {"pl": "Brama:", "en": "Gateway:"},
    "home.uptime": {"pl": "Czas pracy:", "en": "Uptime:"},
    "home.refresh": {"pl": "Odśwież", "en": "Refresh"},

    "uptime.day_one": {"pl": "dzień", "en": "day"},
    "uptime.day_many": {"pl": "dni", "en": "days"},
    "uptime.hour_one": {"pl": "godzina", "en": "hour"},
    "uptime.hour_many": {"pl": "godzin", "en": "hours"},
    "uptime.minute_one": {"pl": "minuta", "en": "minute"},
    "uptime.minute_many": {"pl": "minut", "en": "minutes"},
    "uptime.second_one": {"pl": "sekunda", "en": "second"},
    "uptime.second_many": {"pl": "sekund", "en": "seconds"},

    "conn.title": {"pl": "Połączenie z backendem", "en": "Backend connection"},
    "conn.backend_url": {"pl": "Backend URL:", "en": "Backend URL:"},
    "conn.token": {"pl": "Token rejestracji:", "en": "Enrollment token:"},
    "conn.verify_ssl": {
        "pl": "Weryfikuj certyfikat SSL (odznacz dla self-signed)",
        "en": "Verify SSL certificate (uncheck for self-signed)",
    },
    "conn.save": {"pl": "Zapisz i połącz", "en": "Save and connect"},
    "conn.status_title": {"pl": "Status połączenia", "en": "Connection status"},
    "conn.status_backend": {"pl": "Połączenie z backendem:", "en": "Backend connection:"},
    "conn.status_registered": {"pl": "Zarejestrowany:", "en": "Registered:"},
    "conn.status_token": {"pl": "Token skonfigurowany:", "en": "Token configured:"},
    "conn.refresh_status": {"pl": "Odśwież status", "en": "Refresh status"},
    "conn.state_unknown": {"pl": "Nieznany", "en": "Unknown"},
    "conn.state_checking": {"pl": "Sprawdzanie...", "en": "Checking..."},
    "conn.state_connected": {"pl": "Połączono", "en": "Connected"},
    "conn.state_disconnected": {"pl": "Rozłączono", "en": "Disconnected"},
    "conn.state_unconfigured": {"pl": "Nieskonfigurowany", "en": "Not configured"},
    "conn.unreachable": {"pl": "Niedostępny", "en": "Unreachable"},

    "common.yes": {"pl": "Tak", "en": "Yes"},
    "common.no": {"pl": "Nie", "en": "No"},
    "common.dash": {"pl": "-", "en": "-"},

    "scan.button": {"pl": "Skanuj teraz", "en": "Scan now"},
    "scan.last_scan": {"pl": "Ostatni skan: {ts}", "en": "Last scan: {ts}"},
    "scan.never": {"pl": "Nigdy", "en": "Never"},
    "scan.no_data": {
        "pl": "Brak danych -- uruchom skanowanie.",
        "en": "No data -- run a scan.",
    },
    "scan.none": {"pl": "Brak.", "en": "None."},

    "section.system": {"pl": "System", "en": "System"},
    "section.hardware": {"pl": "Sprzęt", "en": "Hardware"},
    "section.software": {"pl": "Oprogramowanie", "en": "Software"},
    "section.network": {"pl": "Sieć", "en": "Network"},
    "section.security": {"pl": "Bezpieczeństwo", "en": "Security"},
    "section.peripherals": {"pl": "Peryferia", "en": "Peripherals"},
    "section.events": {"pl": "Zdarzenia", "en": "Events"},
    "section.users_and_groups": {"pl": "Użytkownicy", "en": "Users"},

    "log.success": {"pl": "Sukces", "en": "Success"},
    "log.error": {"pl": "Błąd", "en": "Error"},
    "log.info": {"pl": "Info", "en": "Info"},

    "log.msg_config": {"pl": "Config: {path}", "en": "Config: {path}"},
    "log.msg_state": {"pl": "State:  {path}", "en": "State:  {path}"},
    "log.msg_missing_fields": {
        "pl": "Podaj Backend URL i token rejestracji.",
        "en": "Enter Backend URL and enrollment token.",
    },
    "log.msg_saving": {
        "pl": "Zapisano config.json -- rejestruję urządzenie...",
        "en": "Saved config.json -- enrolling device...",
    },
    "log.msg_connected": {
        "pl": "Połączono jako urządzenie {device_id} (matched={matched})",
        "en": "Connected as device {device_id} (matched={matched})",
    },
    "log.msg_connect_error": {"pl": "Błąd połączenia: {err}", "en": "Connection error: {err}"},
    "log.msg_no_config": {"pl": "Brak konfiguracji: {err}", "en": "No configuration: {err}"},
    "log.msg_connect_first": {
        "pl": "Najpierw połącz się z backendem (zakładka Połączenie).",
        "en": "Connect to the backend first (Connection tab).",
    },
    "log.msg_scanning": {
        "pl": "Skanowanie hosta (to może potrwać do minuty)...",
        "en": "Scanning host (this can take up to a minute)...",
    },
    "log.msg_scan_ok": {"pl": "Skan wysłany poprawnie.", "en": "Scan sent successfully."},
    "log.msg_scan_failed": {"pl": "Skan nie powiódł się: {err}", "en": "Scan failed: {err}"},
    "log.msg_tasks_failed": {
        "pl": "Sprawdzanie zadań nie powiodło się: {err}",
        "en": "Task check failed: {err}",
    },
}


class Translator:
    def __init__(self, language: str = LANG_PL) -> None:
        self.language = language if language in LANGUAGES else LANG_PL

    def t(self, key: str, **kwargs: object) -> str:
        entry = _STRINGS.get(key)
        if entry is None:
            return key
        text = entry.get(self.language, entry.get(LANG_PL, key))
        return text.format(**kwargs) if kwargs else text
