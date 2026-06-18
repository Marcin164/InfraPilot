# InfraPilot Windows Agent

Skanuje hosta z systemem Windows i wysyła snapshot na backend InfraPilot.
Format payloadu pasuje 1:1 do widoków w
`frontend/src/Pages/Main/Devices` (Hardware, Network, Security, Software,
Peripherals, Events, Users, SystemInfo).

Trzymane prosto: **jeden binary, jeden instalator, jedna ścieżka deployu**.

## Model deployu

```
   Settings > Windows Agent          backend (self-hosted)
   (admin wgrywa .exe przez UI) ───► uploads/agent/InfraPilotAgentSetup.exe
                                              │
                                              ▼
   Frontend "Settings > Windows Agent"     GET /devices/agent/installer
   (admin kopiuje snippet)                 + /devices/agent/setup-info
                                              │
                                              ▼
                                          host Windows
```

1. **Build lokalny / CI** produkuje `InfraPilotAgentSetup-x.y.z.exe`
   (patrz "Build" poniżej).
2. **Admin tenanta** w **Settings → Windows Agent** wgrywa ten plik
   przyciskiem "Wgraj instalator" — backend zapisuje go pod
   `uploads/agent/` (ten sam wolumin co inne uploady) i serwuje go publicznie
   pod `GET /devices/agent/installer`. Brak kroku Docker-build-arg / GitHub
   Releases — to jest teraz domyślna ścieżka.
3. Strona pokazuje też Backend URL + `AGENT_ENROLLMENT_TOKEN` + gotowy
   snippet PowerShell, który pobiera ten URL.
4. **Operator hosta** wkleja snippet w elevated PowerShell:
   `Invoke-WebRequest ...` + `setup.exe /SILENT /BACKENDURL=... /TOKEN=...`.
   Instalator robi wszystko cicho, host pojawia się w UI po ~30 s.
5. Opcjonalnie: ustaw `AGENT_INSTALLER_URL` w `.env`, żeby zamiast
   self-hostingu wskazać zewnętrzny adres (CDN / GitHub Releases) — wtedy
   ten URL nadpisuje przesłany plik.

## Co siedzi w środku

```
windowsApp/
├── agent/                     # Python agent
│   ├── main.py                # CLI entry
│   ├── config.py              # config.json + state.json + DPAPI
│   ├── dpapi.py               # ctypes DPAPI wrapper (no pywin32)
│   ├── transport.py           # HMAC POST /devices/agent/data
│   ├── enrollment.py          # POST /devices/agent/enroll
│   ├── fingerprint.py         # TPM/MAC/CPU/serial collector
│   ├── installer_core.py      # schtasks register/unregister
│   ├── tasks.py                # POST /devices/agent/tasks/{claim,complete,fail}
│   ├── gui.py                  # Tkinter status/connect/rescan window
│   ├── winauth.py               # ctypes LogonUserW -- gates GUI connection edits
│   └── scanner/               # 8 sekcji: system/hardware/software/...
├── installer/installer.iss    # Inno Setup -- CLI args flow only
├── scripts/build.ps1          # PyInstaller + Inno Setup
├── requirements.txt
└── README.md
```

## CLI agenta

```
infrapilot-agent.exe --once                 # jeden skan (Task Scheduler)
infrapilot-agent.exe --watch                # pętla
infrapilot-agent.exe --dry-run              # wypisz payload, nie wysyłaj
infrapilot-agent.exe --enroll-only          # tylko enrollment
infrapilot-agent.exe --force-enroll         # discard state + enroll
infrapilot-agent.exe --register-task        # post-install hook (Inno Setup)
infrapilot-agent.exe --unregister-task      # uninstall hook
```

Po każdym skanie (`--once`, co iterację `--watch`, i po kliknięciu "Skanuj
teraz" w GUI) agent odpytuje `/devices/agent/tasks/claim` o zadania zlecone
z zakładki "Tasks" na karcie urządzenia. Trzy typy, żaden nie przyjmuje
parametrów (payload się nie używa): `scan_now` / `inventory_refresh`
wymuszają pełny skan, `collect_event_log` wysyła tylko sekcję `events`.
Było tu kiedyś jeszcze `custom`, ale nic mu nie dawało zdefiniowanego
zachowania (agent zawsze zwracał failed) — usunięty, bo zrobienie z niego
czegoś użytecznego oznaczałoby pozwolenie adminowi na zdalne odpalanie
dowolnej, nieaudytowanej treści na hoście.

## GUI agenta (`infrapilot-agent-gui.exe`)

Prosty Tkinter-owy okienek dla operatora siedzącego przy hoście — nie
zastępuje CLI/Task Schedulera, jest dodatkiem na sytuacje, gdy ktoś nie chce
bawić się w PowerShell:

- **Status** — czy `config.json`/`state.json` istnieją, czy host jest
  zarejestrowany (Device ID), kiedy był ostatni skan, czy backend
  odpowiada na `GET /health`.
- **Połącz z backendem** — pola Backend URL + token, przycisk zapisuje
  `config.json` i robi enrollment (to samo co `--force-enroll`, tylko
  bez terminala). **Zablokowane domyślnie** — pola i przycisk "Zapisz i
  połącz" są wyszarzone, dopóki operator nie wpisze hasła swojego konta
  Windows (sprawdzanego przez `LogonUserW`, ten sam mechanizm co logowanie
  do systemu). To dodatkowa bariera ponad samym UAC -- okno GUI samo w
  sobie już działa z podniesionymi uprawnieniami, więc bez tej blokady
  ktokolwiek mający dostęp do otwartego okna mógłby przekierować agenta na
  inny backend albo zmienić token bez podawania żadnego hasła. Odblokowanie
  utrzymuje się do zamknięcia okna (bez automatycznego re-locka po zapisie).
- **Skanuj teraz** — pełny skan + wysyłka, z logiem powodzenia/błędu w
  oknie (to samo co `--once`, bez czekania na Task Scheduler). Nie wymaga
  odblokowania -- samo skanowanie nie zmienia konfiguracji.

Wymaga uprawnień administratora (manifest `requireAdministrator` wbudowany
przez `--uac-admin` w build.ps1) — `config.json`/`state.json` są ACL'owane
tylko dla SYSTEM + Administrators, więc bez elewacji odczyt/zapis i tak by
się nie udał. Dostępny ze Start Menu ("InfraPilot Agent") po instalacji;
instalator oferuje też jego automatyczne otwarcie na stronie Finish, jeśli
po instalacji `config.json` jeszcze nie istnieje (czyli zainstalowano bez
`/BACKENDURL=`/`/TOKEN=`).

## Pliki na hoście

| Ścieżka | Co tam jest |
|---------|-------------|
| `C:\Program Files\InfraPilot\agent\infrapilot-agent.exe` | Binarka CLI (scheduled task) |
| `C:\Program Files\InfraPilot\agent\infrapilot-agent-gui.exe` | GUI (status/connect/rescan) |
| `C:\ProgramData\InfraPilot\agent\config.json` | Backend URL + token (DPAPI po pierwszym czytaniu) |
| `C:\ProgramData\InfraPilot\agent\state.json`  | device_id + sekret (DPAPI) |
| `C:\ProgramData\InfraPilot\agent\agent.log`   | Log skaner + enroll |

## Build (lokalny)

Wymagania:
- Python 3.10+ na PATH
- [Inno Setup 6](https://jrsoftware.org/isinfo.php) w standardowej ścieżce

```powershell
cd D:\Projects\WebDev\InfraPilot\windowsApp
.\scripts\build.ps1 -Clean
```

Wynik: `installer\Output\InfraPilotAgentSetup-0.1.0.exe`.

## Build (CI)

Push tagu `vX.Y.Z` → workflow `.github/workflows/windows-agent.yml` zrobi
build na `windows-latest` i wrzuci `.exe` jako asset Release'a.

## Bezpieczeństwo

- **HMAC per scan**: `HMAC_SHA256(sha256(secret), "${ts}|${nonce}|${body}")`,
  walidacja w `backend/src/guards/agentGuard.guard.ts`.
- **DPAPI LocalMachine**: token w `config.json` i sekret w `state.json`
  zaszyfrowane — skopiowanie pliku na inny host nic nie da.
- **ACL**: oba pliki tylko SYSTEM + Administrators (Inno Setup `[Dirs]`
  `Permissions: admins-full system-full`).
- **Enrollment token rotation**: zmiana `AGENT_ENROLLMENT_TOKEN` w env
  backendu + restart. Stare instalatory padają na enrollu, już enrolled
  hosty jadą dalej (mają per-device HMAC secrets).
