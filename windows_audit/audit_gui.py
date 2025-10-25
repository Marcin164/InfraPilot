import sys
import threading
import time
import json
import os
import hashlib
import requests

from PySide6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QLabel, QPushButton,
    QProgressBar, QMessageBox, QFileDialog, QCheckBox
)
from PySide6.QtCore import Qt, Signal, QObject, QTimer, QPropertyAnimation
from PySide6.QtGui import QIcon

# import backendowych modułów audytu
from modules.system_info import get_system_info
from modules.hardware_info import get_hardware_info
from modules.software_info import get_software_info
from modules.network_info import get_network_info
from modules.security_info import get_security_info
from modules.events_info import get_events_info
from modules.peripherals_info import get_peripherals_info

CACHE_FILE = "audit_cache.json"
ENDPOINT = "http://localhost:3000/devices/agent/data"

# ------------------ FUNKCJE POMOCNICZE ------------------
def hash_dict(data: dict) -> str:
    """Zwraca hash SHA256 dla danych JSON, aby sprawdzić zmiany."""
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()


def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_cache(cache_data):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, indent=2, ensure_ascii=False)


# ------------------ WORKER ------------------
class Worker(QObject):
    progress = Signal(int)
    finished = Signal(dict)

    def __init__(self, mode="fast", output_path="system_audit.json"):
        super().__init__()
        self.mode = mode
        self.output_path = output_path

    def run(self):
        """Uruchamia skanowanie systemu z cache i raportuje postęp."""
        audit_data = {}
        cache = load_cache()
        cache_hashes = cache.get("hashes", {})

        steps = [
            # ("System", get_system_info),
            # ("Hardware", get_hardware_info),
            # ("Software", get_software_info),
            # ("Network", get_network_info),
            # ("Security", get_security_info)
            ("Peripherals", get_peripherals_info)
        ]

        if self.mode == "full":
            steps.append(("Events", get_events_info))

        new_hashes = {}
        for i, (name, func) in enumerate(steps):
            try:
                data = func()
                data_hash = hash_dict(data)
                new_hashes[name] = data_hash

                if cache_hashes.get(name) == data_hash:
                    audit_data[name.lower()] = cache.get("data", {}).get(name.lower(), {})
                else:
                    audit_data[name.lower()] = data

            except Exception as e:
                audit_data[name.lower()] = {"error": str(e)}

            progress = int(((i + 1) / len(steps)) * 100)
            self.progress.emit(progress)
            time.sleep(0.2)

        # zapis do cache
        save_cache({"hashes": new_hashes, "data": audit_data})

        # zapis do pliku
        with open(self.output_path, "w", encoding="utf-8") as f:
            json.dump(audit_data, f, indent=2, ensure_ascii=False)

        # wysyłanie danych do API
        try:
            print('wyslano')
            # requests.post(ENDPOINT, json=audit_data, timeout=5)
        except Exception as e:
            audit_data["_upload_error"] = str(e)

        self.finished.emit(audit_data)


# ------------------ GŁÓWNA APLIKACJA ------------------
class AuditApp(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("System Audit Tool v1.1")
        self.setWindowIcon(QIcon("app.ico"))
        self.setFixedSize(420, 340)
        self.setStyleSheet("""
            QWidget { background-color: #1e1e1e; color: #e0e0e0; font-family: Segoe UI; }
            QPushButton {
                background-color: #0078d4; color: white; border: none;
                padding: 10px; border-radius: 6px;
            }
            QPushButton:hover { background-color: #1890f0; }
            QProgressBar {
                border: 1px solid #444; border-radius: 6px;
                text-align: center; height: 20px;
            }
            QProgressBar::chunk {
                background-color: #0078d4; border-radius: 6px;
            }
            QCheckBox { margin: 5px; }
        """)

        layout = QVBoxLayout()

        self.title = QLabel("🧩 System Audit Tool")
        self.title.setAlignment(Qt.AlignCenter)
        self.title.setStyleSheet("font-size: 20px; font-weight: bold; margin-top: 10px;")

        self.version = QLabel("v1.1.0")
        self.version.setAlignment(Qt.AlignCenter)
        self.version.setStyleSheet("color: #888; margin-bottom: 10px;")

        self.mode_checkbox = QCheckBox("🔍 Tryb pełny (wolniejszy, szczegółowy audyt)")
        self.path_button = QPushButton("📁 Wybierz lokalizację raportu")
        self.path_button.clicked.connect(self.choose_output_path)
        self.output_path_label = QLabel("Domyślnie: system_audit.json")
        self.output_path_label.setAlignment(Qt.AlignCenter)
        self.output_path_label.setStyleSheet("font-size: 12px; color: #aaa;")

        self.progress = QProgressBar()
        self.progress.setValue(0)
        self.progress.setAlignment(Qt.AlignCenter)

        self.button = QPushButton("▶ Uruchom audyt")
        self.button.clicked.connect(self.start_audit)

        layout.addWidget(self.title)
        layout.addWidget(self.version)
        layout.addWidget(self.mode_checkbox)
        layout.addWidget(self.path_button)
        layout.addWidget(self.output_path_label)
        layout.addWidget(self.button)
        layout.addWidget(self.progress)
        layout.addStretch()

        self.setLayout(layout)
        self.output_path = "system_audit.json"
        self.animation = None

    def choose_output_path(self):
        path, _ = QFileDialog.getSaveFileName(
            self, "Wybierz lokalizację raportu", "system_audit.json",
            "JSON Files (*.json);;All Files (*.*)"
        )
        if path:
            self.output_path = path
            self.output_path_label.setText(f"Zapisz do: {path}")

    def start_audit(self):
        self.button.setEnabled(False)
        self.progress.setValue(0)
        self.title.setText("🔍 Trwa skanowanie systemu...")

        mode = "full" if self.mode_checkbox.isChecked() else "fast"
        self.worker = Worker(mode=mode, output_path=self.output_path)
        self.worker.progress.connect(self.animate_progress)
        self.worker.finished.connect(self.audit_done)

        thread = threading.Thread(target=self.worker.run)
        thread.start()

    def animate_progress(self, target_value):
        if self.animation:
            self.animation.stop()
        self.animation = QPropertyAnimation(self.progress, b"value")
        self.animation.setDuration(400)
        self.animation.setStartValue(self.progress.value())
        self.animation.setEndValue(target_value)
        self.animation.start()

    def audit_done(self, data):
        self.title.setText("✅ Audyt zakończony")
        self.progress.setValue(100)
        self.button.setEnabled(True)

        msg = "Audyt zakończony pomyślnie!\n\n"
        msg += f"Wyniki zapisano do:\n{self.output_path}\n"
        if "_upload_error" in data:
            msg += f"\n⚠️ Nie udało się wysłać danych: {data['_upload_error']}"
        else:
            msg += "\n📡 Dane wysłano na serwer"

        QMessageBox.information(self, "Audyt ukończony", msg)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setWindowIcon(QIcon("app.ico"))
    win = AuditApp()
    win.show()
    sys.exit(app.exec())