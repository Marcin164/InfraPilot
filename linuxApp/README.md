# InfraPilot Linux Agent

Skanuje hosta z systemem Linux i wysyła snapshot na backend InfraPilot.
Format payloadu pasuje 1:1 do widoków w
`frontend/src/Pages/Main/Devices` (Hardware, Network, Security, Software,
Peripherals, Events, Users, SystemInfo) -- patrz docstring każdego modułu
w `agent/scanner/` dla tego, jak konkretne pole jest zbierane na Linuksie
(`/proc`, `/sys`, `dmidecode`, `lsblk`, `journalctl`, ...) i gdzie Linux po
prostu nie ma odpowiednika danego pola Windows (UWP AppX, Windows
Features, UAC, SecurityCenter2 AV registry).

To jest **nowy agent współdzielący tylko warstwę protokołu** z agentami
Windows (`windowsApp/`) i macOS (`macApp/`) -- żadna z 8 sekcji skanera
nie jest portowalna 1:1, każda platforma ma własne źródło danych
(CIM/WMI, `system_profiler`, `/proc`+`/sys`).

## Model deployu

Analogiczny do Windows/macOS (`windowsApp/README.md`, `macApp/README.md`),
z różnicami wynikającymi z platformy:

1. **Build lokalny / CI** produkuje `InfraPilotAgentSetup-x.y.z-<arch>.deb`
   (patrz "Build" poniżej).
2. **Admin tenanta** w **Settings → Linux Agent** wgrywa ten plik --
   backend serwuje go pod `GET /devices/agent/installer?platform=linux`.
3. Strona pokazuje Backend URL + `AGENT_ENROLLMENT_TOKEN` (ten sam token
   floty co dla Windows/macOS) + gotowy snippet bash.
4. **Operator hosta** wkleja snippet w terminalu:
   ```bash
   curl -fsSL "<installerUrl>" -o /tmp/InfraPilotAgentSetup.deb
   sudo env BACKEND_URL="<backend>" ENROLL_TOKEN="<token>" dpkg -i /tmp/InfraPilotAgentSetup.deb
   ```
   `BACKEND_URL`/`ENROLL_TOKEN` są środowiskowym odpowiednikiem Inno
   Setup's `/BACKENDURL=`/`/TOKEN=` -- `dpkg` odpala je jako środowisko
   `installer/postinst`, który pisze `config.json` i rejestruje jednostki
   `systemd`. Host pojawia się w UI po ~30 s.
5. Bez `BACKEND_URL`/`ENROLL_TOKEN` w środowisku, instalacja kończy się
   bez konfiguracji -- operator otwiera **InfraPilot Agent** z menu
   aplikacji (albo `/opt/infrapilot/agent/gui/infrapilot-agent-gui`) i
   łączy się przez "Connect to backend".

## Co siedzi w środku

```
linuxApp/
├── agent/                     # Python agent
│   ├── main.py                # CLI entry
│   ├── config.py              # config.json + state.json + Secret Service refs
│   ├── secretstore.py         # `secret-tool` (libsecret) wrapper, best-effort
│   ├── linuxauth.py           # pkexec (PolicyKit) helper -- gates GUI privileged actions
│   ├── transport.py           # HMAC POST /devices/agent/data
│   ├── enrollment.py          # POST /devices/agent/enroll
│   ├── fingerprint.py         # machine-id/MAC/DMI serial collector
│   ├── installer_core.py      # systemd service+timer register/unregister
│   ├── tasks.py                # POST /devices/agent/tasks/{claim,complete,fail}
│   ├── gui.py                  # Tkinter status/connect/rescan window
│   └── scanner/                # 8 sekcji: system/hardware/software/...
├── installer/
│   ├── postinst                # .deb postinst -- config.json + systemd
│   ├── prerm                   # .deb prerm -- systemd cleanup on removal
│   └── control.template         # dpkg control stanza (version/arch/size are sed'd in)
├── scripts/build.sh            # PyInstaller + dpkg-deb
├── requirements.txt
└── README.md
```

## CLI agenta

Same flags as Windows/macOS
(`infrapilot-agent --once|--watch|--dry-run|--enroll-only|--force-enroll`),
plus Linux-specific lifecycle hooks:

```
infrapilot-agent --write-config      # postinst hook: reads BACKEND_URL/ENROLL_TOKEN from env
infrapilot-agent --register-task     # postinst hook: systemd service+timer install
infrapilot-agent --unregister-task   # prerm hook: systemd service+timer removal
```

Po każdym skanie (`--once`, co iterację `--watch`, i po kliknięciu "Scan
now" w GUI) agent odpytuje `/devices/agent/tasks/claim` o zadania
zlecone z zakładki "Tasks" na karcie urządzenia -- identycznie jak
Windows/macOS (`scan_now` / `inventory_refresh` / `collect_event_log`).

## GUI agenta (`infrapilot-agent-gui`)

Tkinter-owe okienko dla operatora siedzącego przy hoście -- nie
zastępuje CLI/`systemd timer`a, jest dodatkiem na sytuacje, gdy ktoś nie
chce bawić się w terminal:

- **Status** -- czy `config.json`/`state.json` istnieją, czy host jest
  zarejestrowany (Device ID), kiedy był ostatni skan, czy backend
  odpowiada na `GET /health`.
- **Connect to backend** -- pola Backend URL + token, przycisk zapisuje
  `config.json` i robi enrollment (to samo co `--force-enroll`, tylko
  bez terminala).
- **Scan now** -- pełny skan + wysyłka, z logiem powodzenia/błędu w
  oknie (to samo co `--once`, bez czekania na `systemd timer`).

W przeciwieństwie do Windows (gdzie cały GUI startuje podniesiony przez
UAC na cały czas życia okna, dodatkowo zablokowany hasłem -- zobacz
`winauth.py`), ten GUI działa **bez podniesionych uprawnień**, bliżej
modelu macOS -- każda akcja, która pisze pod `/etc/infrapilot` albo
rejestruje/wyrejestrowuje jednostki `systemd`, odpala CLI-a ponownie
przez `pkexec` (PolicyKit), czyli natywny monit hasła administratora
*dla tej jednej akcji* (zobacz docstring `agent/linuxauth.py`).

## Pliki na hoście

| Ścieżka | Co tam jest |
|---------|-------------|
| `/opt/infrapilot/agent/infrapilot-agent` | Binarka CLI (systemd timer) |
| `/opt/infrapilot/agent/gui/infrapilot-agent-gui` | GUI (status/connect/rescan) |
| `/usr/bin/infrapilot-agent` | Symlink na binarkę CLI |
| `/etc/infrapilot/agent/config.json` | Backend URL + token (Secret Service ref jeśli dostępny) |
| `/etc/infrapilot/agent/state.json`  | device_id + sekret (Secret Service ref jeśli dostępny) |
| `/etc/infrapilot/agent/agent.log`   | Log skaner + enroll |
| `/etc/systemd/system/infrapilot-agent.service` + `.timer` | Harmonogram (odpowiednik Task Scheduler/launchd) |

## Build (lokalny)

Wymagania:
- Python 3.10+
- `dpkg-deb` (pakiet `dpkg-dev`, domyślnie obecny na Debian/Ubuntu)

```bash
cd linuxApp
./scripts/build.sh
```

Wynik: `installer/Output/InfraPilotAgentSetup-0.1.0-amd64.deb`.

`./scripts/build.sh --skip-installer` buduje same binarki PyInstaller
(`dist/infrapilot-agent`, `dist/infrapilot-agent-gui`) bez pakowania do
`.deb`.

## Build (CI)

Push tagu `vX.Y.Z` → workflow `.github/workflows/linux-agent.yml` zrobi
build na `ubuntu-latest` i wrzuci `.deb` jako asset Release'a.

## Bezpieczeństwo

- **HMAC per scan**: identyczny schemat co Windows/macOS --
  `HMAC_SHA256(sha256(secret), "${ts}|${nonce}|${body}")`, walidacja w
  `backend/src/guards/agentGuard.guard.ts`.
- **Secret Service (best-effort) + uprawnienia plików**: gdy działa
  keyring D-Bus (operator zalogowany w sesji graficznej), token i
  sekret są referencjami `secret-service:<account>` do niego. W trybie
  bezobsługowym (`systemd` service jako root, bez sesji -- normalny
  przypadek na serwerze) nie ma do czego zapisać sekret przez keyring,
  więc wartość leży wprost w pliku -- granicą bezpieczeństwa jest wtedy
  katalog `0700`/pliki `0600`, oba root-owned (zobacz docstring
  `agent/secretstore.py`).
- **Elewacja per-akcja (GUI)**: jak macOS -- GUI nie trzyma podniesionych
  uprawnień, każda zmiana konfiguracji idzie przez `pkexec` (PolicyKit),
  czyli natywny monit administratora w danym momencie.
- **Enrollment token rotation**: identyczne z Windows/macOS -- zmiana
  `AGENT_ENROLLMENT_TOKEN` + restart backendu unieważnia stare
  instalatory, już zarejestrowane hosty (per-device HMAC secret) działają
  dalej.
