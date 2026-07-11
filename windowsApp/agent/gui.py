"""Minimal desktop GUI for the InfraPilot Windows agent.

Three jobs, matching what an operator standing in front of the host
actually needs:

1. Show whether the agent is configured/enrolled and able to reach the
   backend (status panel).
2. Let them paste a Backend URL + enrollment token and connect, as an
   alternative to the installer CLI flags / PowerShell snippet.
3. Let them trigger an immediate scan and see whether it succeeded.

Reads/writes the same config.json / state.json as the CLI agent (main.py),
so the scheduled task and this GUI never disagree about state. Needs to
run elevated -- those files are ACL'd to Administrators + SYSTEM only
(see installer.iss) -- the GUI build in scripts/build.ps1 embeds a
"requireAdministrator" manifest so Windows prompts for UAC automatically.
"""

from __future__ import annotations

import logging
import queue
import sys
import threading
import tkinter as tk
from datetime import datetime, timezone
from pathlib import Path
from tkinter import ttk
from typing import Callable

import requests

# PyInstaller freezes this file as the bare __main__ script (no package
# context), which breaks the relative imports below -- same reason
# main.py uses absolute imports too. Put windowsApp/ on sys.path so
# `agent` is importable as a top-level package regardless of how this
# file is invoked (frozen exe, `python agent/gui.py`, or `python -m agent.gui`).
if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agent.config import (
    DEFAULT_CONFIG_PATH, DEFAULT_STATE_PATH,
    AgentConfig, load_config, load_state, read_state_raw, save_config,
    touch_last_scan, write_state,
)
from agent.enrollment import enroll
from agent.main import SECTION_COLLECTORS, build_payload, process_tasks
from agent.transport import send_scan


def _iso_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _fmt_timestamp(value: str | None) -> str:
    if not value:
        return "Nigdy"
    try:
        dt = datetime.fromisoformat(value)
        return dt.astimezone().strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return value


class AgentGui(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("InfraPilot Agent")
        self.geometry("520x620")
        self.minsize(480, 560)

        self._work_queue: queue.Queue[Callable[[], None]] = queue.Queue()
        self._busy = False

        self._build_widgets()
        self.after(100, self._drain_queue)
        self.refresh_status()

    # ---- layout -----------------------------------------------------

    def _build_widgets(self) -> None:
        pad = {"padx": 10, "pady": 6}

        status_frame = ttk.LabelFrame(self, text="Status")
        status_frame.pack(fill="x", **pad)

        self.status_vars: dict[str, tk.StringVar] = {
            "backend_url": tk.StringVar(value="-"),
            "token": tk.StringVar(value="-"),
            "enrolled": tk.StringVar(value="-"),
            "last_scan": tk.StringVar(value="-"),
            "connectivity": tk.StringVar(value="-"),
        }
        rows = [
            ("Backend URL:", "backend_url"),
            ("Token skonfigurowany:", "token"),
            ("Zarejestrowany:", "enrolled"),
            ("Ostatni skan:", "last_scan"),
            ("Połączenie z backendem:", "connectivity"),
        ]
        for i, (label, key) in enumerate(rows):
            ttk.Label(status_frame, text=label).grid(row=i, column=0, sticky="w", padx=6, pady=3)
            ttk.Label(status_frame, textvariable=self.status_vars[key]).grid(
                row=i, column=1, sticky="w", padx=6, pady=3,
            )

        ttk.Button(status_frame, text="Odśwież status", command=self.refresh_status).grid(
            row=len(rows), column=0, columnspan=2, pady=(4, 6),
        )

        connect_frame = ttk.LabelFrame(self, text="Połącz z backendem")
        connect_frame.pack(fill="x", **pad)
        connect_frame.columnconfigure(1, weight=1)

        ttk.Label(connect_frame, text="Backend URL:").grid(row=0, column=0, sticky="w", padx=6, pady=4)
        self.backend_url_entry = ttk.Entry(connect_frame, width=42, state="normal")
        self.backend_url_entry.grid(row=0, column=1, columnspan=2, sticky="we", padx=6, pady=4)

        ttk.Label(connect_frame, text="Token rejestracji:").grid(row=1, column=0, sticky="w", padx=6, pady=4)
        self.token_entry = ttk.Entry(connect_frame, width=42, show="*", state="normal")
        self.token_entry.grid(row=1, column=1, columnspan=2, sticky="we", padx=6, pady=4)

        self.connect_button = ttk.Button(
            connect_frame, text="Zapisz i połącz", command=self._on_connect_clicked,
        )
        self.connect_button.grid(row=2, column=0, columnspan=3, pady=(4, 6))

        scan_frame = ttk.LabelFrame(self, text="Skanowanie")
        scan_frame.pack(fill="x", **pad)
        self.scan_button = ttk.Button(scan_frame, text="Skanuj teraz", command=self._on_scan_clicked)
        self.scan_button.pack(pady=6)

        log_frame = ttk.LabelFrame(self, text="Dziennik")
        log_frame.pack(fill="both", expand=True, **pad)
        self.log_text = tk.Text(log_frame, height=10, state="disabled", wrap="word")
        self.log_text.pack(fill="both", expand=True, padx=6, pady=6)

        self.log(f"Config: {DEFAULT_CONFIG_PATH}")
        self.log(f"State:  {DEFAULT_STATE_PATH}")

    # ---- helpers ------------------------------------------------------

    def log(self, message: str) -> None:
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.configure(state="normal")
        self.log_text.insert("end", f"[{timestamp}] {message}\n")
        self.log_text.see("end")
        self.log_text.configure(state="disabled")

    def _drain_queue(self) -> None:
        try:
            while True:
                job = self._work_queue.get_nowait()
                job()
        except queue.Empty:
            pass
        self.after(100, self._drain_queue)

    def _set_busy(self, busy: bool) -> None:
        self._busy = busy
        self.scan_button.configure(state="disabled" if busy else "normal")
        self.connect_button.configure(state="disabled" if busy else "normal")

    @staticmethod
    def _set_entry_text(entry: ttk.Entry, value: str) -> None:
        """Programmatically set an Entry's text regardless of its current
        normal/disabled state, restoring that state afterwards."""
        prev_state = str(entry["state"])
        entry.configure(state="normal")
        entry.delete(0, "end")
        entry.insert(0, value)
        entry.configure(state=prev_state)

    def _run_in_background(self, fn: Callable[[], None]) -> None:
        if self._busy:
            return
        self._set_busy(True)

        def runner() -> None:
            try:
                fn()
            finally:
                self._work_queue.put(lambda: self._set_busy(False))

        threading.Thread(target=runner, daemon=True).start()

    # ---- status ---------------------------------------------------

    def refresh_status(self) -> None:
        try:
            cfg = load_config(DEFAULT_CONFIG_PATH)
        except Exception:
            cfg = None

        self.status_vars["backend_url"].set(cfg.backend_url if cfg else "(nieskonfigurowany)")
        self.status_vars["token"].set("Tak" if cfg and cfg.enrollment_token else "Nie")
        if cfg:
            self._set_entry_text(self.backend_url_entry, cfg.backend_url)

        raw_state = read_state_raw(DEFAULT_STATE_PATH)
        if raw_state and raw_state.get("device_id"):
            self.status_vars["enrolled"].set(f"Tak (ID: {raw_state['device_id']})")
        else:
            self.status_vars["enrolled"].set("Nie")
        self.status_vars["last_scan"].set(_fmt_timestamp(raw_state.get("last_scan_at") if raw_state else None))

        if not cfg:
            self.status_vars["connectivity"].set("-")
            return

        self.status_vars["connectivity"].set("Sprawdzanie...")
        backend_url = cfg.backend_url

        def check() -> None:
            try:
                resp = requests.get(f"{backend_url}/health", timeout=5)
                ok = resp.status_code < 400
                result = "OK" if ok else f"HTTP {resp.status_code}"
            except Exception as err:  # noqa: BLE001
                result = f"Niedostępny ({err})"
            self._work_queue.put(lambda: self.status_vars["connectivity"].set(result))

        threading.Thread(target=check, daemon=True).start()

    # ---- actions ----------------------------------------------------

    def _on_connect_clicked(self) -> None:
        backend_url = self.backend_url_entry.get().strip()
        token = self.token_entry.get().strip()
        if not backend_url or not token:
            self.log("Podaj Backend URL i token rejestracji.")
            return

        def work() -> None:
            try:
                save_config(
                    DEFAULT_CONFIG_PATH, backend_url=backend_url, enrollment_token=token,
                    log_path=str(DEFAULT_STATE_PATH.parent / "agent.log"),
                )
                cfg = AgentConfig(backend_url=backend_url.rstrip("/"), enrollment_token=token)
                self._work_queue.put(lambda: self.log("Zapisano config.json -- rejestruję urządzenie..."))
                result = enroll(cfg)
                write_state(
                    DEFAULT_STATE_PATH,
                    device_id=result["deviceId"], secret_plaintext=result["secret"],
                    matched=bool(result.get("matched")),
                    match_reasons=result.get("matchReasons") or [],
                )
                msg = f"Połączono jako urządzenie {result['deviceId']} (matched={result.get('matched')})"
                self._work_queue.put(lambda: (self.log(msg), self.refresh_status()))
            except Exception as err:  # noqa: BLE001
                err_msg = str(err)
                self._work_queue.put(lambda: self.log(f"Błąd połączenia: {err_msg}"))

        self._run_in_background(work)

    def _on_scan_clicked(self) -> None:
        def work() -> None:
            try:
                cfg = load_config(DEFAULT_CONFIG_PATH)
            except Exception as err:  # noqa: BLE001
                err_msg = str(err)
                self._work_queue.put(lambda: self.log(f"Brak konfiguracji: {err_msg}"))
                return

            raw_state = read_state_raw(DEFAULT_STATE_PATH)
            if not raw_state or not raw_state.get("device_id"):
                self._work_queue.put(lambda: self.log("Najpierw połącz się z backendem (sekcja powyżej)."))
                return

            self._work_queue.put(lambda: self.log("Skanowanie hosta (to może potrwać do minuty)..."))
            try:
                state = load_state(DEFAULT_STATE_PATH)
                payload = build_payload(list(SECTION_COLLECTORS.keys()))
                send_scan(cfg, state, payload)
                touch_last_scan(DEFAULT_STATE_PATH, _iso_now())
                self._work_queue.put(lambda: (self.log("Skan wysłany poprawnie."), self.refresh_status()))
            except Exception as err:  # noqa: BLE001
                err_msg = str(err)
                self._work_queue.put(lambda: self.log(f"Skan nie powiódł się: {err_msg}"))
                return

            # Otherwise only --once/--watch (the scheduled task) ever check
            # for admin-queued tasks (Devices > Tasks tab) -- an operator
            # who only ever uses "Skanuj teraz" would never have them run.
            try:
                process_tasks(cfg, state, list(SECTION_COLLECTORS.keys()))
            except Exception as err:  # noqa: BLE001
                err_msg = str(err)
                self._work_queue.put(lambda: self.log(f"Sprawdzanie zadań nie powiodło się: {err_msg}"))

        self._run_in_background(work)


def main() -> int:
    logging.basicConfig(level=logging.WARNING)
    app = AgentGui()
    app.mainloop()
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
