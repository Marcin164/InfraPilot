"""Menu-bar GUI for the InfraPilot macOS agent (rumps).

Same three jobs as the Windows Tkinter GUI (see windowsApp/agent/gui.py):

1. Status -- whether config/state exist, last scan, backend reachability.
2. "Połącz z backendem" -- enter Backend URL + token as an alternative to
   the pkg installer's BACKEND_URL/ENROLL_TOKEN env vars.
3. "Skanuj teraz" -- trigger an immediate scan and report success/failure.

Unlike the Windows GUI (which runs UAC-elevated for its whole lifetime and
gates the Connect form with an extra password re-check -- see
``macauth.py``'s docstring for why), this app runs **unprivileged**.
Every action that needs to write under "/Library/Application Support" or
touch the System keychain re-invokes this same CLI elevated for a single
command via ``macauth.run_privileged``, which pops the native macOS
admin-password prompt for that one action.

Two sequential ``rumps.Window`` prompts (Backend URL, then token) are used
instead of a single two-field form: ``rumps.Window`` is itself a thin
wrapper over an NSAlert + NSTextField, so this is already native UI --
hand-rolling a multi-field NSAlert accessory view via PyObjC would add
real complexity for no user-visible benefit over two short prompts.
"""

from __future__ import annotations

import sys
import threading
from datetime import datetime
from pathlib import Path

import requests
import rumps

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agent.config import DEFAULT_CONFIG_PATH, DEFAULT_STATE_PATH, load_config, read_state_raw
from agent.macauth import PrivilegedActionCancelled, run_privileged


def _fmt_timestamp(value: str | None) -> str:
    if not value:
        return "Nigdy"
    try:
        return datetime.fromisoformat(value).astimezone().strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return value


class AgentApp(rumps.App):
    def __init__(self) -> None:
        super().__init__("InfraPilot Agent", icon=None, quit_button="Zamknij")
        self.status_items = {
            "backend_url":  rumps.MenuItem("Backend URL: -"),
            "enrolled":     rumps.MenuItem("Zarejestrowany: -"),
            "last_scan":    rumps.MenuItem("Ostatni skan: -"),
            "connectivity": rumps.MenuItem("Połączenie: -"),
        }
        self.menu = [
            *self.status_items.values(),
            None,
            rumps.MenuItem("Odśwież status", callback=self.refresh_status),
            rumps.MenuItem("Połącz z backendem...", callback=self.on_connect),
            rumps.MenuItem("Skanuj teraz", callback=self.on_scan),
        ]
        self.refresh_status(None)

    # ---- status ---------------------------------------------------

    def refresh_status(self, _sender) -> None:
        try:
            cfg = load_config(DEFAULT_CONFIG_PATH)
        except Exception:
            cfg = None

        self.status_items["backend_url"].title = (
            f"Backend URL: {cfg.backend_url if cfg else '(nieskonfigurowany)'}"
        )
        raw_state = read_state_raw(DEFAULT_STATE_PATH)
        if raw_state and raw_state.get("device_id"):
            self.status_items["enrolled"].title = f"Zarejestrowany: Tak ({raw_state['device_id']})"
        else:
            self.status_items["enrolled"].title = "Zarejestrowany: Nie"
        self.status_items["last_scan"].title = (
            f"Ostatni skan: {_fmt_timestamp(raw_state.get('last_scan_at') if raw_state else None)}"
        )

        if not cfg:
            self.status_items["connectivity"].title = "Połączenie: -"
            return

        def check() -> None:
            try:
                resp = requests.get(f"{cfg.backend_url}/health", timeout=5)
                result = "OK" if resp.status_code < 400 else f"HTTP {resp.status_code}"
            except Exception as err:  # noqa: BLE001
                result = f"Niedostępny ({err})"
            self.status_items["connectivity"].title = f"Połączenie: {result}"

        threading.Thread(target=check, daemon=True).start()

    # ---- actions ----------------------------------------------------

    def on_connect(self, _sender) -> None:
        url_window = rumps.Window(
            message="Adres backendu (np. https://infrapilot.firma.pl)",
            title="Połącz z backendem -- krok 1/2",
            default_text="", ok="Dalej", cancel="Anuluj",
        )
        url_resp = url_window.run()
        if not url_resp.clicked or not url_resp.text.strip():
            return
        backend_url = url_resp.text.strip()

        token_window = rumps.Window(
            message="Token rejestracji (Settings > macOS Agent w panelu admina)",
            title="Połącz z backendem -- krok 2/2",
            default_text="", ok="Połącz", cancel="Anuluj", secure=True,
        )
        token_resp = token_window.run()
        if not token_resp.clicked or not token_resp.text.strip():
            return
        token = token_resp.text.strip()

        def work() -> None:
            exe = sys.executable
            try:
                # `/usr/bin/env VAR=val cmd` sets env for a single command --
                # `do shell script` (run_privileged) doesn't forward this
                # process' own os.environ to the elevated child, so the
                # values have to ride along on the command line itself
                # rather than relying on BACKEND_URL/ENROLL_TOKEN already
                # being set (that path is for the pkg postinstall script,
                # which *is* invoked with them in its environment).
                run_privileged(
                    [
                        "/usr/bin/env", f"BACKEND_URL={backend_url}", f"ENROLL_TOKEN={token}",
                        exe, "-m", "agent.main", "--write-config",
                    ],
                    prompt="InfraPilot Agent chce zapisać ustawienia połączenia.",
                )
                run_privileged(
                    [exe, "-m", "agent.main", "--force-enroll", "--enroll-only"],
                    prompt="InfraPilot Agent chce zarejestrować to urządzenie.",
                )
            except PrivilegedActionCancelled:
                rumps.notification("InfraPilot Agent", "Połączenie", "Odrzucono monit administratora.")
                return
            except Exception as err:  # noqa: BLE001
                rumps.notification("InfraPilot Agent", "Błąd połączenia", str(err)[:200])
                return
            rumps.notification("InfraPilot Agent", "Połączono", f"Backend: {backend_url}")
            self.refresh_status(None)

        threading.Thread(target=work, daemon=True).start()

    def on_scan(self, _sender) -> None:
        def work() -> None:
            try:
                run_privileged(
                    [sys.executable, "-m", "agent.main", "--once"],
                    prompt="InfraPilot Agent chce uruchomić skanowanie.",
                )
            except PrivilegedActionCancelled:
                rumps.notification("InfraPilot Agent", "Skanowanie", "Odrzucono monit administratora.")
                return
            except Exception as err:  # noqa: BLE001
                rumps.notification("InfraPilot Agent", "Skanowanie nie powiodło się", str(err)[:200])
                return
            rumps.notification("InfraPilot Agent", "Skanowanie", "Skan wysłany poprawnie.")
            self.refresh_status(None)

        threading.Thread(target=work, daemon=True).start()


def main() -> int:
    AgentApp().run()
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
