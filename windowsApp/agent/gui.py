"""Desktop GUI for the InfraPilot Windows agent, built on CustomTkinter.

Sidebar + 4 pages, matching what an operator standing in front of the host
(or a helpdesk agent walking them through it) actually needs:

1. **Start** -- quick, at-a-glance host facts (hostname, user, IPs, gateway,
   uptime). Local-only and fast (agent/quickfacts.py), independent of the
   backend connection or a full scan.
2. **Połączenie** -- configure Backend URL / enrollment token / TLS
   verification and see whether the agent can currently reach the backend
   and whether this host is registered.
3. **Skanowanie** -- trigger an immediate scan; results render as one tab
   per section (System/Sprzęt/Sieć/...), each showing the actual collected
   data -- tables for list-of-object fields (disks, installed software,
   local users, ...), key/value grids for single-object fields (baseboard,
   BIOS), not just a one-line count.
4. **Dziennik** -- structured log of what the GUI has done this session
   (connect attempts, scans, task polling), with a success/error badge per
   entry instead of a plain scrolling text blob.

A PL/EN switch at the bottom of the sidebar re-labels every static widget
live via agent/i18n.py. Already-logged Dziennik entries keep whatever
language was active when they were written (log() bakes in translated text
at call time) -- retranslating history wasn't worth the complexity of
storing every message as a (key, kwargs) pair instead of plain text.

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
from typing import Any, Callable

import customtkinter as ctk
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
from agent.i18n import LANG_EN, LANG_PL, Translator
from agent.main import SECTION_COLLECTORS, build_payload, process_tasks
from agent.quickfacts import collect_quick_facts
from agent.transport import send_scan


ctk.set_appearance_mode("system")
ctk.set_default_color_theme("blue")


NAV_KEYS = ["home", "connection", "scan", "logs"]

# Order the 8 scan-payload sections render in (SECTION_COLLECTORS.keys()
# order in main.py) -- translated labels come from i18n's "section.*" keys.
SECTION_KEYS = [
    "system", "hardware", "software", "network",
    "security", "peripherals", "events", "users_and_groups",
]

LEVEL_BADGE_COLORS = {"success": "#16A34A", "error": "#DC2626", "info": "#6B7280"}

NAV_FG_SELECTED = ("#DCE8FF", "#1E3A5F")
NAV_TEXT_SELECTED = ("#1D4ED8", "#7EB1FF")
NAV_TEXT_DEFAULT = ("gray10", "gray90")

DOT_COLORS = {"unknown": "#9CA3AF", "ok": "#22C55E", "fail": "#EF4444"}


def _iso_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _format_uptime(seconds: float, t: Callable[..., str]) -> str:
    total = int(seconds)
    days, rem = divmod(total, 86400)
    hours, rem = divmod(rem, 3600)
    minutes, secs = divmod(rem, 60)

    def unit(n: int, one_key: str, many_key: str) -> str:
        return f"{n} {t(one_key) if n == 1 else t(many_key)}"

    return ", ".join([
        unit(days, "uptime.day_one", "uptime.day_many"),
        unit(hours, "uptime.hour_one", "uptime.hour_many"),
        unit(minutes, "uptime.minute_one", "uptime.minute_many"),
        unit(secs, "uptime.second_one", "uptime.second_many"),
    ])


def _fmt_timestamp(value: str | None, t: Callable[..., str]) -> str:
    if not value:
        return t("scan.never")
    try:
        dt = datetime.fromisoformat(value)
        return dt.astimezone().strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return value


def _prettify_key(key: str) -> str:
    """Raw payload field names (hostname, ram_modules, ...) are already
    English snake_case (see scanner/*'s "matches Xyz.tsx" convention) --
    only cosmetic spacing/casing, not translated per-language."""
    return key.replace("_", " ").strip().capitalize()


def _stringify(value: Any, t: Callable[..., str]) -> str:
    if value is None or value == "":
        return "-"
    if isinstance(value, bool):
        return t("common.yes") if value else t("common.no")
    return str(value)


def _render_table(parent: ctk.CTkBaseClass, rows: list[dict[str, Any]], t: Callable[..., str]) -> None:
    columns = list(rows[0].keys())
    wrapper = ctk.CTkFrame(parent, fg_color="transparent")
    wrapper.pack(fill="x", padx=4, pady=(2, 10))

    tree = ttk.Treeview(wrapper, columns=columns, show="headings", height=min(10, max(3, len(rows))))
    col_width = max(80, min(180, 900 // max(1, len(columns))))
    for c in columns:
        tree.heading(c, text=_prettify_key(c))
        tree.column(c, width=col_width, anchor="w")
    for row in rows:
        tree.insert("", "end", values=[_stringify(row.get(c), t) for c in columns])

    vsb = ttk.Scrollbar(wrapper, orient="vertical", command=tree.yview)
    tree.configure(yscrollcommand=vsb.set)
    tree.pack(side="left", fill="both", expand=True)
    vsb.pack(side="left", fill="y")


def _render_kv(parent: ctk.CTkBaseClass, data: dict[str, Any], t: Callable[..., str]) -> None:
    grid = ctk.CTkFrame(parent, fg_color="transparent")
    grid.pack(fill="x", padx=4, pady=(2, 10))
    for i, (k, v) in enumerate(data.items()):
        ctk.CTkLabel(grid, text=f"{_prettify_key(k)}:", font=ctk.CTkFont(weight="bold")).grid(
            row=i, column=0, sticky="w", padx=(0, 10), pady=1,
        )
        ctk.CTkLabel(grid, text=_stringify(v, t)).grid(row=i, column=1, sticky="w", pady=1)


def render_section_detail(parent: ctk.CTkBaseClass, data: Any, t: Callable[..., str]) -> None:
    """Renders one scan section's raw payload dict into ``parent`` (a
    CTkScrollableFrame) -- a table per list-of-object field, a key/value
    grid per single-object field, plain text otherwise. Generic over all 8
    sections' shapes rather than hardcoding each one -- they're all just
    dicts of lists-of-objects (disks, installed software, local users, ...)
    or single objects (baseboard, BIOS)."""
    for child in parent.winfo_children():
        child.destroy()

    if not isinstance(data, dict) or not data:
        ctk.CTkLabel(parent, text=t("scan.no_data"), text_color="gray50").pack(
            anchor="w", padx=8, pady=8,
        )
        return

    for key, value in data.items():
        ctk.CTkLabel(
            parent, text=_prettify_key(key), font=ctk.CTkFont(size=13, weight="bold"),
        ).pack(anchor="w", padx=4, pady=(8, 0))

        if isinstance(value, list) and value and isinstance(value[0], dict):
            _render_table(parent, value, t)
        elif isinstance(value, list) and value:
            ctk.CTkLabel(
                parent, text=", ".join(_stringify(v, t) for v in value),
                justify="left", wraplength=700,
            ).pack(anchor="w", padx=8, pady=(0, 10))
        elif isinstance(value, list):
            ctk.CTkLabel(parent, text=t("scan.none"), text_color="gray50").pack(
                anchor="w", padx=8, pady=(0, 10),
            )
        elif isinstance(value, dict) and value:
            _render_kv(parent, value, t)
        elif isinstance(value, dict):
            ctk.CTkLabel(parent, text=t("scan.none"), text_color="gray50").pack(
                anchor="w", padx=8, pady=(0, 10),
            )
        else:
            ctk.CTkLabel(parent, text=_stringify(value, t)).pack(
                anchor="w", padx=8, pady=(0, 10),
            )


class AgentGui(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()
        self.title("InfraPilot Agent")
        self.geometry("960x620")
        self.minsize(840, 560)

        self.i18n = Translator(LANG_PL)
        self._static_labels: list[tuple[Any, str]] = []

        self._work_queue: queue.Queue[Callable[[], None]] = queue.Queue()
        self._busy = False
        self._last_payload: dict[str, Any] | None = None
        self._log_rows: list[ctk.CTkFrame] = []

        # Semantic state behind the Połączenie page's derived labels --
        # kept separate from the displayed StringVars so a language switch
        # can recompute the text without re-querying the backend/state.
        self._conn_state = "unset"  # unset | checking | ok | http_error | unreachable
        self._conn_detail = ""
        self._enrolled_device_id: str | None = None
        self._token_configured = False
        self._last_scan_raw: str | None = None
        self._last_uptime_seconds: float | None = None

        self._build_layout()
        self.after(100, self._drain_queue)
        self._show_page("home")
        self.log("log.msg_config", path=str(DEFAULT_CONFIG_PATH))
        self.log("log.msg_state", path=str(DEFAULT_STATE_PATH))
        self.refresh_status()
        self.refresh_home()

    def t(self, key: str, **kwargs: object) -> str:
        return self.i18n.t(key, **kwargs)

    # ---- layout -----------------------------------------------------

    def _build_layout(self) -> None:
        container = ctk.CTkFrame(self, fg_color="transparent")
        container.pack(fill="both", expand=True)
        container.rowconfigure(0, weight=1)
        container.columnconfigure(1, weight=1)

        sidebar = ctk.CTkFrame(container, width=170, corner_radius=0)
        sidebar.grid(row=0, column=0, sticky="ns")
        sidebar.grid_propagate(False)

        self.content = ctk.CTkFrame(container, fg_color="transparent")
        self.content.grid(row=0, column=1, sticky="nsew")
        self.content.rowconfigure(0, weight=1)
        self.content.columnconfigure(0, weight=1)

        self._nav_buttons: dict[str, ctk.CTkButton] = {}
        for key in NAV_KEYS:
            btn = ctk.CTkButton(
                sidebar, text=self.t(f"nav.{key}"), anchor="w", corner_radius=6,
                fg_color="transparent", text_color=NAV_TEXT_DEFAULT,
                hover_color=("gray85", "gray25"),
                command=lambda k=key: self._show_page(k),
            )
            btn.pack(fill="x", padx=10, pady=(14 if key == "home" else 4, 4))
            self._nav_buttons[key] = btn
            self._static_labels.append((btn, f"nav.{key}"))

        lang_switch = ctk.CTkSegmentedButton(
            sidebar, values=["PL", "EN"], command=self._on_language_selected,
        )
        lang_switch.set("PL")
        lang_switch.pack(side="bottom", fill="x", padx=10, pady=14)

        self._pages: dict[str, ctk.CTkFrame] = {
            "home": self._build_home_page(self.content),
            "connection": self._build_connection_page(self.content),
            "scan": self._build_scan_page(self.content),
            "logs": self._build_logs_page(self.content),
        }
        for frame in self._pages.values():
            frame.grid(row=0, column=0, sticky="nsew")

    def _show_page(self, key: str) -> None:
        self._pages[key].tkraise()
        for k, btn in self._nav_buttons.items():
            selected = k == key
            btn.configure(
                fg_color=NAV_FG_SELECTED if selected else "transparent",
                text_color=NAV_TEXT_SELECTED if selected else NAV_TEXT_DEFAULT,
            )

    def _on_language_selected(self, value: str) -> None:
        self._set_language(LANG_PL if value == "PL" else LANG_EN)

    def _set_language(self, lang: str) -> None:
        if lang == self.i18n.language:
            return
        self.i18n.language = lang
        for widget, key in self._static_labels:
            widget.configure(text=self.t(key))
        self._rebuild_scan_tabs()
        self._render_conn_status()
        self._render_enrolled()
        self._render_token()
        self._render_last_scan()
        self._render_home_uptime()

    # ---- Start page ---------------------------------------------------

    def _build_home_page(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(parent, fg_color="transparent")

        box = ctk.CTkFrame(frame)
        box.pack(fill="x", padx=16, pady=16)
        title = ctk.CTkLabel(box, text=self.t("home.title"), font=ctk.CTkFont(size=14, weight="bold"))
        title.grid(row=0, column=0, columnspan=2, sticky="w", padx=14, pady=(12, 8))
        self._static_labels.append((title, "home.title"))

        self.home_vars: dict[str, tk.StringVar] = {
            k: tk.StringVar(value="-")
            for k in ("hostname", "username", "ipv4", "ipv6", "gateway", "uptime")
        }
        rows = [
            ("home.hostname", "hostname"),
            ("home.username", "username"),
            ("home.ipv4", "ipv4"),
            ("home.ipv6", "ipv6"),
            ("home.gateway", "gateway"),
            ("home.uptime", "uptime"),
        ]
        for i, (label_key, key) in enumerate(rows, start=1):
            label = ctk.CTkLabel(box, text=self.t(label_key), font=ctk.CTkFont(weight="bold"))
            label.grid(row=i, column=0, sticky="w", padx=14, pady=4)
            self._static_labels.append((label, label_key))
            ctk.CTkLabel(box, textvariable=self.home_vars[key]).grid(
                row=i, column=1, sticky="w", padx=14, pady=4,
            )

        refresh_btn = ctk.CTkButton(box, text=self.t("home.refresh"), command=self.refresh_home)
        refresh_btn.grid(row=len(rows) + 1, column=0, columnspan=2, pady=(8, 14))
        self._static_labels.append((refresh_btn, "home.refresh"))
        return frame

    def refresh_home(self) -> None:
        def work() -> None:
            facts = collect_quick_facts()

            def apply() -> None:
                for k, v in facts.items():
                    if k == "uptime_seconds":
                        continue
                    self.home_vars[k].set(v)
                self._last_uptime_seconds = facts.get("uptime_seconds")
                self._render_home_uptime()

            self._work_queue.put(apply)

        threading.Thread(target=work, daemon=True).start()

    def _render_home_uptime(self) -> None:
        if self._last_uptime_seconds is None:
            self.home_vars["uptime"].set("-")
        else:
            self.home_vars["uptime"].set(_format_uptime(self._last_uptime_seconds, self.t))

    # ---- Połączenie page ------------------------------------------------

    def _build_connection_page(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(parent, fg_color="transparent")

        top = ctk.CTkFrame(frame, fg_color="transparent")
        top.pack(fill="x", padx=16, pady=(16, 4))
        self.conn_dot_label = ctk.CTkLabel(
            top, text="●", text_color=DOT_COLORS["unknown"], font=ctk.CTkFont(size=16),
        )
        self.conn_dot_label.pack(side="left")
        self.conn_status_var = tk.StringVar(value=self.t("conn.state_unknown"))
        ctk.CTkLabel(
            top, textvariable=self.conn_status_var, font=ctk.CTkFont(size=14, weight="bold"),
        ).pack(side="left", padx=(6, 0))

        form = ctk.CTkFrame(frame)
        form.pack(fill="x", padx=16, pady=8)
        form.columnconfigure(1, weight=1)
        form_title = ctk.CTkLabel(form, text=self.t("conn.title"), font=ctk.CTkFont(size=14, weight="bold"))
        form_title.grid(row=0, column=0, columnspan=2, sticky="w", padx=14, pady=(12, 8))
        self._static_labels.append((form_title, "conn.title"))

        url_label = ctk.CTkLabel(form, text=self.t("conn.backend_url"))
        url_label.grid(row=1, column=0, sticky="w", padx=14, pady=4)
        self._static_labels.append((url_label, "conn.backend_url"))
        self.backend_url_entry = ctk.CTkEntry(form, width=380)
        self.backend_url_entry.grid(row=1, column=1, sticky="we", padx=14, pady=4)

        token_label = ctk.CTkLabel(form, text=self.t("conn.token"))
        token_label.grid(row=2, column=0, sticky="w", padx=14, pady=4)
        self._static_labels.append((token_label, "conn.token"))
        self.token_entry = ctk.CTkEntry(form, width=380, show="*")
        self.token_entry.grid(row=2, column=1, sticky="we", padx=14, pady=4)

        self.verify_tls_var = tk.BooleanVar(value=True)
        verify_check = ctk.CTkCheckBox(form, text=self.t("conn.verify_ssl"), variable=self.verify_tls_var)
        verify_check.grid(row=3, column=0, columnspan=2, sticky="w", padx=14, pady=(4, 4))
        self._static_labels.append((verify_check, "conn.verify_ssl"))

        self.connect_button = ctk.CTkButton(form, text=self.t("conn.save"), command=self._on_connect_clicked)
        self.connect_button.grid(row=4, column=0, columnspan=2, pady=(6, 14))
        self._static_labels.append((self.connect_button, "conn.save"))

        info = ctk.CTkFrame(frame)
        info.pack(fill="x", padx=16, pady=8)
        info_title = ctk.CTkLabel(info, text=self.t("conn.status_title"), font=ctk.CTkFont(size=14, weight="bold"))
        info_title.grid(row=0, column=0, columnspan=2, sticky="w", padx=14, pady=(12, 8))
        self._static_labels.append((info_title, "conn.status_title"))

        self.status_vars: dict[str, tk.StringVar] = {
            "connectivity": tk.StringVar(value="-"),
            "enrolled": tk.StringVar(value="-"),
            "token": tk.StringVar(value="-"),
        }
        status_rows = [
            ("conn.status_backend", "connectivity"),
            ("conn.status_registered", "enrolled"),
            ("conn.status_token", "token"),
        ]
        for i, (label_key, key) in enumerate(status_rows, start=1):
            label = ctk.CTkLabel(info, text=self.t(label_key))
            label.grid(row=i, column=0, sticky="w", padx=14, pady=3)
            self._static_labels.append((label, label_key))
            ctk.CTkLabel(info, textvariable=self.status_vars[key]).grid(
                row=i, column=1, sticky="w", padx=14, pady=3,
            )
        ctk.CTkLabel(info, text="").grid(row=len(status_rows) + 1, column=0, pady=(0, 8))

        refresh_status_btn = ctk.CTkButton(
            frame, text=self.t("conn.refresh_status"), command=self.refresh_status,
            fg_color="transparent", border_width=1, text_color=NAV_TEXT_DEFAULT,
        )
        refresh_status_btn.pack(anchor="w", padx=16, pady=(0, 16))
        self._static_labels.append((refresh_status_btn, "conn.refresh_status"))
        return frame

    def _set_conn_dot(self, state: str) -> None:
        self.conn_dot_label.configure(text_color=DOT_COLORS[state])

    def _render_conn_status(self) -> None:
        state = self._conn_state
        if state == "unset":
            self.status_vars["connectivity"].set(self.t("common.dash"))
            self.conn_status_var.set(self.t("conn.state_unconfigured"))
            self._set_conn_dot("unknown")
        elif state == "checking":
            self.status_vars["connectivity"].set(self.t("conn.state_checking"))
            self.conn_status_var.set(self.t("conn.state_checking"))
            self._set_conn_dot("unknown")
        elif state == "ok":
            self.status_vars["connectivity"].set("OK")
            self.conn_status_var.set(self.t("conn.state_connected"))
            self._set_conn_dot("ok")
        elif state == "http_error":
            self.status_vars["connectivity"].set(f"HTTP {self._conn_detail}")
            self.conn_status_var.set(self.t("conn.state_disconnected"))
            self._set_conn_dot("fail")
        elif state == "unreachable":
            self.status_vars["connectivity"].set(f"{self.t('conn.unreachable')} ({self._conn_detail})")
            self.conn_status_var.set(self.t("conn.state_disconnected"))
            self._set_conn_dot("fail")

    def _render_enrolled(self) -> None:
        if self._enrolled_device_id:
            self.status_vars["enrolled"].set(f"{self.t('common.yes')} (ID: {self._enrolled_device_id})")
        else:
            self.status_vars["enrolled"].set(self.t("common.no"))

    def _render_token(self) -> None:
        self.status_vars["token"].set(self.t("common.yes") if self._token_configured else self.t("common.no"))

    def _render_last_scan(self) -> None:
        ts = _fmt_timestamp(self._last_scan_raw, self.t)
        self.last_scan_var.set(self.t("scan.last_scan", ts=ts))

    # ---- Skanowanie page --------------------------------------------

    def _build_scan_page(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        self._scan_page_frame = frame

        top = ctk.CTkFrame(frame, fg_color="transparent")
        top.pack(fill="x", padx=16, pady=16)
        self.scan_button = ctk.CTkButton(top, text=self.t("scan.button"), command=self._on_scan_clicked)
        self.scan_button.pack(side="left")
        self._static_labels.append((self.scan_button, "scan.button"))
        self.last_scan_var = tk.StringVar(value="-")
        ctk.CTkLabel(top, textvariable=self.last_scan_var).pack(side="left", padx=(12, 0))
        self._render_last_scan()

        self.scan_tabview = self._build_scan_tabview(frame)
        return frame

    def _build_scan_tabview(self, parent: ctk.CTkFrame) -> ctk.CTkTabview:
        tabview = ctk.CTkTabview(parent)
        tabview.pack(fill="both", expand=True, padx=16, pady=(0, 16))

        self._section_frames: dict[str, ctk.CTkScrollableFrame] = {}
        for key in SECTION_KEYS:
            tab = tabview.add(self.t(f"section.{key}"))
            scroll = ctk.CTkScrollableFrame(tab, fg_color="transparent")
            scroll.pack(fill="both", expand=True)
            self._section_frames[key] = scroll
            render_section_detail(scroll, self._last_payload.get(key) if self._last_payload else None, self.t)
        return tabview

    def _rebuild_scan_tabs(self) -> None:
        """CTkTabview has no supported "rename tab" API, so a language
        switch rebuilds just this tabview (not the whole app) and replays
        the last scan payload into the fresh tabs."""
        self.scan_tabview.destroy()
        self.scan_tabview = self._build_scan_tabview(self._scan_page_frame)

    def _render_scan_sections(self, payload: dict[str, Any]) -> None:
        self._last_payload = payload
        for key, frame in self._section_frames.items():
            render_section_detail(frame, payload.get(key), self.t)

    # ---- Dziennik page --------------------------------------------------

    def _build_logs_page(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        self.logs_scroll = ctk.CTkScrollableFrame(frame, fg_color="transparent")
        self.logs_scroll.pack(fill="both", expand=True, padx=16, pady=16)
        return frame

    def log(self, key: str, level: str = "info", **kwargs: object) -> None:
        message = self.t(key, **kwargs)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        row = ctk.CTkFrame(self.logs_scroll, fg_color=("gray92", "gray17"))

        ctk.CTkLabel(
            row, text=self.t(f"log.{level}"), width=64, corner_radius=6,
            fg_color=LEVEL_BADGE_COLORS.get(level, "#6B7280"), text_color="white",
            font=ctk.CTkFont(size=11, weight="bold"),
        ).pack(side="left", padx=8, pady=6)
        ctk.CTkLabel(
            row, text=timestamp, width=140, anchor="w", text_color=("gray30", "gray70"),
        ).pack(side="left", padx=(0, 8), pady=6)
        ctk.CTkLabel(
            row, text=message, anchor="w", justify="left", wraplength=560,
        ).pack(side="left", fill="x", expand=True, padx=(0, 8), pady=6)

        if self._log_rows:
            row.pack(fill="x", pady=(0, 6), before=self._log_rows[0])
        else:
            row.pack(fill="x", pady=(0, 6))
        self._log_rows.insert(0, row)

    # ---- helpers ------------------------------------------------------

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
    def _set_entry_text(entry: ctk.CTkEntry, value: str) -> None:
        prev_state = str(entry.cget("state"))
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

        if cfg:
            self._set_entry_text(self.backend_url_entry, cfg.backend_url)
            self.verify_tls_var.set(cfg.verify_tls)
        self._token_configured = bool(cfg and cfg.enrollment_token)
        self._render_token()

        raw_state = read_state_raw(DEFAULT_STATE_PATH)
        self._enrolled_device_id = raw_state.get("device_id") if raw_state else None
        self._render_enrolled()
        self._last_scan_raw = raw_state.get("last_scan_at") if raw_state else None
        self._render_last_scan()

        if not cfg:
            self._conn_state = "unset"
            self._render_conn_status()
            return

        self._conn_state = "checking"
        self._render_conn_status()
        backend_url = cfg.backend_url
        verify = cfg.verify_tls

        def check() -> None:
            try:
                resp = requests.get(f"{backend_url}/health", timeout=5, verify=verify)
                ok = resp.status_code < 400
                state = "ok" if ok else "http_error"
                detail = "" if ok else str(resp.status_code)
            except Exception as err:  # noqa: BLE001
                state = "unreachable"
                detail = str(err)

            def apply() -> None:
                self._conn_state = state
                self._conn_detail = detail
                self._render_conn_status()

            self._work_queue.put(apply)

        threading.Thread(target=check, daemon=True).start()

    # ---- actions ----------------------------------------------------

    def _on_connect_clicked(self) -> None:
        backend_url = self.backend_url_entry.get().strip()
        token = self.token_entry.get().strip()
        if not backend_url or not token:
            self.log("log.msg_missing_fields", "error")
            return
        verify_tls = self.verify_tls_var.get()

        def work() -> None:
            try:
                save_config(
                    DEFAULT_CONFIG_PATH, backend_url=backend_url, enrollment_token=token,
                    verify_tls=verify_tls,
                    log_path=str(DEFAULT_STATE_PATH.parent / "agent.log"),
                )
                cfg = AgentConfig(
                    backend_url=backend_url.rstrip("/"), enrollment_token=token,
                    verify_tls=verify_tls,
                )
                self._work_queue.put(lambda: self.log("log.msg_saving", "info"))
                result = enroll(cfg)
                write_state(
                    DEFAULT_STATE_PATH,
                    device_id=result["deviceId"], secret_plaintext=result["secret"],
                    matched=bool(result.get("matched")),
                    match_reasons=result.get("matchReasons") or [],
                )
                device_id, matched = result["deviceId"], result.get("matched")
                self._work_queue.put(lambda: (
                    self.log("log.msg_connected", "success", device_id=device_id, matched=matched),
                    self.refresh_status(),
                ))
            except Exception as err:  # noqa: BLE001
                err_msg = str(err)
                self._work_queue.put(lambda: self.log("log.msg_connect_error", "error", err=err_msg))

        self._run_in_background(work)

    def _on_scan_clicked(self) -> None:
        def work() -> None:
            try:
                cfg = load_config(DEFAULT_CONFIG_PATH)
            except Exception as err:  # noqa: BLE001
                err_msg = str(err)
                self._work_queue.put(lambda: self.log("log.msg_no_config", "error", err=err_msg))
                return

            raw_state = read_state_raw(DEFAULT_STATE_PATH)
            if not raw_state or not raw_state.get("device_id"):
                self._work_queue.put(lambda: self.log("log.msg_connect_first", "error"))
                return

            self._work_queue.put(lambda: self.log("log.msg_scanning", "info"))
            try:
                state = load_state(DEFAULT_STATE_PATH)
                payload = build_payload(list(SECTION_COLLECTORS.keys()))
                send_scan(cfg, state, payload)
                touch_last_scan(DEFAULT_STATE_PATH, _iso_now())

                def on_success() -> None:
                    self.log("log.msg_scan_ok", "success")
                    self._render_scan_sections(payload)
                    self.refresh_status()

                self._work_queue.put(on_success)
            except Exception as err:  # noqa: BLE001
                err_msg = str(err)
                self._work_queue.put(lambda: self.log("log.msg_scan_failed", "error", err=err_msg))
                return

            # Otherwise only --once/--watch (the scheduled task) ever check
            # for admin-queued tasks (Devices > Tasks tab) -- an operator
            # who only ever uses "Skanuj teraz" would never have them run.
            try:
                process_tasks(cfg, state, list(SECTION_COLLECTORS.keys()))
            except Exception as err:  # noqa: BLE001
                err_msg = str(err)
                self._work_queue.put(lambda: self.log("log.msg_tasks_failed", "error", err=err_msg))

        self._run_in_background(work)


def main() -> int:
    logging.basicConfig(level=logging.WARNING)
    app = AgentGui()
    app.mainloop()
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
