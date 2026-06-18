# InfraPilot macOS Agent

Skanuje hosta z systemem macOS i wysyła snapshot na backend InfraPilot.
Format payloadu pasuje 1:1 do widoków w
`frontend/src/Pages/Main/Devices` (Hardware, Network, Security, Software,
Peripherals, Events, Users, SystemInfo) -- patrz docstring każdego modułu
w `agent/scanner/` dla tego, jak konkretne pole jest zbierane na macOS
(`system_profiler`, `psutil`, `dscl`, ...) i gdzie macOS po prostu nie ma
odpowiednika danego pola Windows (TPM, UAC, AppX, Windows Features).

To jest **nowy agent współdzielący tylko warstwę protokołu** z agentem
Windows (`windowsApp/`) -- żadna z 9 sekcji skanera nie jest portowalna,
bo cała logika Windows opiera się na `Get-CimInstance` (WMI/CIM), czego
na macOS po prostu nie ma.

## Model deployu

Analogiczny do Windows (`windowsApp/README.md`), z różnicami wynikającymi
z platformy:

1. **Build lokalny / CI** produkuje `InfraPilotAgentSetup-x.y.z.pkg`
   (patrz "Build" poniżej) -- podpisany Developer ID + notaryzowany.
2. **Admin tenanta** w **Settings → macOS Agent** wgrywa ten plik —
   backend serwuje go pod `GET /devices/agent/installer?platform=macos`.
3. Strona pokazuje Backend URL + `AGENT_ENROLLMENT_TOKEN` (ten sam token
   floty co dla Windows) + gotowy snippet bash.
4. **Operator hosta** wkleja snippet w Terminalu:
   ```bash
   curl -fsSL "<installerUrl>" -o /tmp/InfraPilotAgentSetup.pkg
   sudo BACKEND_URL="<backend>" ENROLL_TOKEN="<token>" installer -pkg /tmp/InfraPilotAgentSetup.pkg -target /
   ```
   `BACKEND_URL`/`ENROLL_TOKEN` są środowiskowym odpowiednikiem Inno
   Setup's `/BACKENDURL=`/`/TOKEN=` -- `installer` przekazuje je do
   `installer/scripts/postinstall`, który pisze `config.json` i
   rejestruje daemona `launchd`. Host pojawia się w UI po ~30 s.
5. Bez `BACKEND_URL`/`ENROLL_TOKEN` w środowisku, instalacja kończy się
   bez konfiguracji -- operator otwiera **InfraPilot Agent** z menu bar
   (`/Applications`) i łączy się przez "Połącz z backendem...".

## Co siedzi w środku

```
macApp/
├── agent/                     # Python agent
│   ├── main.py                # CLI entry
│   ├── config.py              # config.json + state.json + keychain refs
│   ├── keychain.py            # `security` CLI wrapper (System keychain)
│   ├── macauth.py             # osascript "with administrator privileges" helper
│   ├── transport.py           # HMAC POST /devices/agent/data
│   ├── enrollment.py          # POST /devices/agent/enroll
│   ├── fingerprint.py         # IOPlatformUUID/serial/MAC collector
│   ├── installer_core.py      # launchd register/unregister
│   ├── tasks.py               # POST /devices/agent/tasks/{claim,complete,fail}
│   ├── gui.py                 # rumps menu-bar app
│   └── scanner/               # 8 sekcji: system/hardware/software/...
├── installer/
│   ├── scripts/postinstall    # pkg postinstall -- config.json + launchd
│   └── distribution.xml       # productbuild definition
├── scripts/build.sh           # PyInstaller + codesign + pkgbuild + notarize
├── requirements.txt
└── README.md
```

## CLI agenta

Same flags as Windows (`infrapilot-agent --once|--watch|--dry-run|
--enroll-only|--force-enroll`), plus macOS-specific lifecycle hooks:

```
infrapilot-agent --write-config      # postinstall hook: reads BACKEND_URL/ENROLL_TOKEN from env
infrapilot-agent --register-task     # postinstall hook: launchd bootstrap
infrapilot-agent --unregister-task   # uninstall hook: launchd bootout
```

## GUI agenta (`InfraPilot Agent.app`)

Ikonka w menu bar (rumps) -- Status / "Połącz z backendem..." / "Skanuj
teraz". W przeciwieństwie do Windows (gdzie cały GUI startuje podniesiony
przez UAC i dodatkowo blokuje edycję hasłem konta, bo elewacja trwa tak
długo jak całe okno), ten GUI działa **bez podniesionych uprawnień** --
każda akcja, która pisze pod `/Library/Application Support` albo do
Keychain, odpala siebie samego ponownie przez `osascript ... with
administrator privileges`, czyli natywny monit hasła administratora *dla
tej jednej akcji* (zobacz docstring `agent/macauth.py`).

## Pliki na hoście

| Ścieżka | Co tam jest |
|---------|-------------|
| `/Library/Application Support/InfraPilot/agent/infrapilot-agent` | Binarka CLI (LaunchDaemon) |
| `/Applications/InfraPilot Agent.app` | GUI (status/connect/rescan) |
| `/Library/Application Support/InfraPilot/agent/config.json` | Backend URL + token (referencja do Keychain) |
| `/Library/Application Support/InfraPilot/agent/state.json` | device_id + referencja do sekretu w Keychain |
| `/Library/Application Support/InfraPilot/agent/agent.log` | Log skaner + enroll |
| `/Library/LaunchDaemons/com.infrapilot.agent.plist` | Harmonogram (odpowiednik Task Scheduler) |

## Build (lokalny)

Wymagania:
- macOS + Xcode command line tools (`codesign`, `pkgbuild`, `productbuild`,
  `productsign`, `xcrun notarytool`)
- Python 3.10+
- Developer ID Application + Developer ID Installer certyfikaty w
  login keychain, plus profil `notarytool store-credentials` (patrz
  komentarz na górze `scripts/build.sh`)

```bash
cd macApp
APPLE_DEVELOPER_ID_APPLICATION="Developer ID Application: ..." \
APPLE_DEVELOPER_ID_INSTALLER="Developer ID Installer: ..." \
APPLE_NOTARY_PROFILE=infrapilot-notary \
./scripts/build.sh
```

Wynik: `installer/Output/InfraPilotAgentSetup-0.1.0.pkg` (podpisany +
zszywka notaryzacji). `./scripts/build.sh --skip-sign` buduje niepodpisaną
wersję do lokalnych testów -- Gatekeeper zablokuje ją na innym Macu.

## Build (CI)

Push tagu `vX.Y.Z` → workflow `.github/workflows/macos-agent.yml` zrobi
build na `macos-latest` i wrzuci `.pkg` jako asset Release'a. Wymaga
sekretów repo `APPLE_DEVELOPER_ID_APPLICATION`, `APPLE_DEVELOPER_ID_INSTALLER`,
`APPLE_NOTARY_PROFILE` + zaimportowanego certyfikatu (poza zakresem tego
pliku -- do skonfigurowania przez właściciela konta Apple Developer).

## Bezpieczeństwo

- **HMAC per scan**: identyczny schemat co Windows --
  `HMAC_SHA256(sha256(secret), "${ts}|${nonce}|${body}")`, walidacja w
  `backend/src/guards/agentGuard.guard.ts`.
- **System Keychain**: token w `config.json` i sekret w `state.json` są
  tylko referencjami (`keychain:<account>`) -- realna wartość żyje w
  `/Library/Keychains/System.keychain`, czytelna bez promptu tylko dla
  procesów root (LaunchDaemon).
- **Uprawnienia plików**: `config.json`/`state.json` `chmod 600`,
  katalog tylko zapisywalny przez root.
- **Elewacja per-akcja**: GUI nie trzyma podniesionych uprawnień -- każda
  zmiana konfiguracji wymaga natywnego monitu administratora w danym
  momencie (zobacz sekcję GUI powyżej).
- **Enrollment token rotation**: identyczne z Windows -- zmiana
  `AGENT_ENROLLMENT_TOKEN` + restart backendu unieważnia stare instalatory,
  już zarejestrowane hosty (per-device HMAC secret) działają dalej.
