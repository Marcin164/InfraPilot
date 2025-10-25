import subprocess

def run_ps(cmd, as_list=False):
    """Uruchamia polecenie PowerShell i zwraca stdout (tekst)."""
    ps = [
        "powershell", "-NoProfile", "-NonInteractive",
        "-ExecutionPolicy", "Bypass", "-Command", cmd
    ]
    try:
        out = subprocess.check_output(ps, stderr=subprocess.STDOUT, text=True)
        if as_list:
            return out.splitlines()
        return out
    except subprocess.CalledProcessError as e:
        return f"ERROR: {e}\nOUTPUT:\n{e.output}"
    except Exception as e:
        return f"ERROR: {e}"