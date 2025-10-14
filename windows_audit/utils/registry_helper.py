import winreg


def read_registry_value(root, path, name):
    try:
        with winreg.OpenKey(root, path) as key:
            val, _ = winreg.QueryValueEx(key, name)
            return val
    except Exception as e:
        return None