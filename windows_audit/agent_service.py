# agent_service.py
import win32serviceutil
import win32service
import win32event
import servicemanager
import threading
import http.server
import socketserver
import json
import os
import sys

# Import backendowych modułów
from modules.system_info import get_system_info
from modules.hardware_info import get_hardware_info
from modules.software_info import get_software_info
from modules.network_info import get_network_info
from modules.security_info import get_security_info
from modules.events_info import get_events_info


class AgentHandler(http.server.BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8"))

    def do_POST(self):
        if self.path == "/scan":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            try:
                params = json.loads(body)
            except Exception:
                params = {}

            mode = params.get("mode", "fast")
            output_path = params.get("output_path", "system_audit.json")

            steps = [
                ("system", get_system_info),
                ("hardware", get_hardware_info),
                ("software", get_software_info),
                ("network", get_network_info),
                ("security", get_security_info)
            ]
            if mode == "full":
                steps.append(("events", get_events_info))

            result = {}
            for name, func in steps:
                try:
                    result[name] = func()
                except Exception as e:
                    result[name] = {"error": str(e)}

            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)

            self._send_json({"status": "ok", "data": result})
        else:
            self._send_json({"error": "Invalid endpoint"}, 404)


class AgentService(win32serviceutil.ServiceFramework):
    _svc_name_ = "SystemAuditAgent"
    _svc_display_name_ = "System Audit Agent Service"
    _svc_description_ = "Performs system audit scans and serves data to local GUI."

    def __init__(self, args):
        super().__init__(args)
        self.stop_event = win32event.CreateEvent(None, 0, 0, None)
        self.running = True
        self.thread = None

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        self.running = False
        win32event.SetEvent(self.stop_event)
        self.ReportServiceStatus(win32service.SERVICE_STOPPED)

    def SvcDoRun(self):
        servicemanager.LogInfoMsg("SystemAuditAgent service started.")
        self.thread = threading.Thread(target=self.run_server)
        self.thread.start()
        win32event.WaitForSingleObject(self.stop_event, win32event.INFINITE)

    def run_server(self):
        with socketserver.ThreadingTCPServer(("127.0.0.1", 5001), AgentHandler) as httpd:
            httpd.allow_reuse_address = True
            while self.running:
                httpd.handle_request()


if __name__ == "__main__":
    win32serviceutil.HandleCommandLine(AgentService)
