import wmi


def get_wmi_connection():
    try:
        return wmi.WMI()
    except Exception as e:
        print("WMI error:", e)
        return None