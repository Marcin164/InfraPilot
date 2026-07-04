"""Minimal desktop GUI for the InfraPilot Linux agent (Tkinter).

Same three jobs as the Windows/macOS agents' GUIs:

1. Status -- whether config/state exist, last scan, backend reachability.
2. "Connect to backend" -- enter Backend URL + token as an alternative to
   the .deb postinst's BACKEND_URL/ENROLL_TOKEN env vars.
3. "Scan now" -- trigger an immediate scan and report success/failure.

Tkinter (not a tray icon via pystray/AppIndicator) on purpose: it ships
with every CPython install, so this GUI has zero extra system packages
to depend on across distros/desktop environments -- the same reasoning
the Windows agent's GUI already used.

Unlike Windows (whole GUI runs UAC-elevated for its lifetime, gated by
a password re-check -- see winauth.py) this runs **unprivileged** as
the logged-in user, closer to the macOS agent's model: every action
that needs to write under /etc/infrapilot or touch systemd re-invokes
the CLI elevated for a single command via ``linuxauth.run_privileged``
(PolicyKit), which pops the desktop's native admin-password dialog for
*that one action* -- see linuxauth.py's docstring for why no separate
re-auth step is needed here.
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

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agent.config import DEFAULT_CONFIG_PATH, DEFAULT_STATE_PATH, load_config, read_state_raw
from agent.linuxauth import PrivilegedActionCancelled, run_privileged


# Installed layout (see installer/postinst + scripts/build.sh). Falls back
# to `python -m agent.main` for local/dev runs where nothing is installed
# under /opt yet.
_INSTALLED_CLI = Path("/opt/infrapilot/agent/infrapilot-agent")


def _cli_command(*args: str) -> list[str]:
    if _INSTALLED_CLI.exists():
        return [str(_INSTALLED_CLI), *args]
    return [sys.executable, "-m", "agent.main", *args]


def _iso_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _fmt_timestamp(value: str | None) -> str:
    if not value:
        return "Never"
    try:
        return datetime.fromisoformat(value).astimezone().strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return value


class AgentGui(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("InfraPilot Agent")
        self.geometry("520x560")
        self.minsize(480, 520)

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
            "enrolled": tk.StringVar(value="-"),
            "last_scan": tk.StringVar(value="-"),
            "connectivity": tk.StringVar(value="-"),
        }
        rows = [
            ("Backend URL:", "backend_url"),
            ("Enrolled:", "enrolled"),
            ("Last scan:", "last_scan"),
            ("Backend connectivity:", "connectivity"),
        ]
        for i, (label, key) in enumerate(rows):
            ttk.Label(status_frame, text=label).grid(row=i, column=0, sticky="w", padx=6, pady=3)
            ttk.Label(status_frame, textvariable=self.status_vars[key]).grid(
                row=i, column=1, sticky="w", padx=6, pady=3,
            )
        ttk.Button(status_frame, text="Refresh status", command=self.refresh_status).grid(
            row=len(rows), column=0, columnspan=2, pady=(4, 6),
        )

        connect_frame = ttk.LabelFrame(self, text="Connect to backend")
        connect_frame.pack(fill="x", **pad)
        connect_frame.columnconfigure(1, weight=1)

        ttk.Label(connect_frame, text="Backend URL:").grid(row=0, column=0, sticky="w", padx=6, pady=4)
        self.backend_url_entry = ttk.Entry(connect_frame, width=42)
        self.backend_url_entry.grid(row=0, column=1, sticky="we", padx=6, pady=4)

        ttk.Label(connect_frame, text="Enrollment token:").grid(row=1, column=0, sticky="w", padx=6, pady=4)
        self.token_entry = ttk.Entry(connect_frame, width=42, show="*")
        self.token_entry.grid(row=1, column=1, sticky="we", padx=6, pady=4)

        self.connect_button = ttk.Button(
            connect_frame, text="Save & connect", command=self._on_connect_clicked,
        )
        self.connect_button.grid(row=2, column=0, columnspan=2, pady=(4, 6))
        ttk.Label(
            connect_frame,
            text="Saving/enrolling asks for your administrator password (PolicyKit).",
            foreground="#7a7a7a",
        ).grid(row=3, column=0, columnspan=2, sticky="w", padx=6)

        scan_frame = ttk.LabelFrame(self, text="Scan")
        scan_frame.pack(fill="x", **pad)
        self.scan_button = ttk.Button(scan_frame, text="Scan now", command=self._on_scan_clicked)
        self.scan_button.pack(pady=6)

        log_frame = ttk.LabelFrame(self, text="Log")
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
        state = "disabled" if busy else "normal"
        self.scan_button.configure(state=state)
        self.connect_button.configure(state=state)

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

        self.status_vars["backend_url"].set(cfg.backend_url if cfg else "(not configured)")

        raw_state = read_state_raw(DEFAULT_STATE_PATH)
        if raw_state and raw_state.get("device_id"):
            self.status_vars["enrolled"].set(f"Yes (ID: {raw_state['device_id']})")
        else:
            self.status_vars["enrolled"].set("No")
        self.status_vars["last_scan"].set(_fmt_timestamp(raw_state.get("last_scan_at") if raw_state else None))

        if not cfg:
            self.status_vars["connectivity"].set("-")
            return

        self.status_vars["connectivity"].set("Checking...")
        backend_url = cfg.backend_url

        def check() -> None:
            try:
                resp = requests.get(f"{backend_url}/health", timeout=5)
                result = "OK" if resp.status_code < 400 else f"HTTP {resp.status_code}"
            except Exception as err:  # noqa: BLE001
                result = f"Unreachable ({err})"
            self._work_queue.put(lambda: self.status_vars["connectivity"].set(result))

        threading.Thread(target=check, daemon=True).start()

    # ---- actions ----------------------------------------------------

    def _on_connect_clicked(self) -> None:
        backend_url = self.backend_url_entry.get().strip()
        token = self.token_entry.get().strip()
        if not backend_url or not token:
            self.log("Enter both the Backend URL and the enrollment token.")
            return

        def work() -> None:
            try:
                # `env VAR=val cmd` sets env for a single command -- pkexec
                # doesn't forward this process' own os.environ to the
                # elevated child, so the values ride along on the command
                # line itself rather than relying on BACKEND_URL/ENROLL_TOKEN
                # already being set (that path is for the postinst script,
                # which *is* invoked with them in its environment).
                run_privileged([
                    "env", f"BACKEND_URL={backend_url}", f"ENROLL_TOKEN={token}",
                    *_cli_command("--write-config"),
                ])
                run_privileged(_cli_command("--force-enroll", "--enroll-only"))
            except PrivilegedActionCancelled:
                self._work_queue.put(lambda: self.log("PolicyKit prompt was dismissed."))
                return
            except Exception as err:  # noqa: BLE001
                err_msg = str(err)
                self._work_queue.put(lambda: self.log(f"Connection failed: {err_msg}"))
                return
            self._work_queue.put(lambda: (self.log("Connected."), self.refresh_status()))

        self._run_in_background(work)

    def _on_scan_clicked(self) -> None:
        def work() -> None:
            self._work_queue.put(lambda: self.log("Scanning host (this can take up to a minute)..."))
            try:
                run_privileged(_cli_command("--once"))
            except PrivilegedActionCancelled:
                self._work_queue.put(lambda: self.log("PolicyKit prompt was dismissed."))
                return
            except Exception as err:  # noqa: BLE001
                err_msg = str(err)
                self._work_queue.put(lambda: self.log(f"Scan failed: {err_msg}"))
                return
            self._work_queue.put(lambda: (self.log("Scan sent successfully."), self.refresh_status()))

        self._run_in_background(work)


def main() -> int:
    logging.basicConfig(level=logging.WARNING)
    app = AgentGui()
    app.mainloop()
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
