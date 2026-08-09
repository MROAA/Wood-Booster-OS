import time
import random

class Windows11Win32Subsystem:
    """Simuloi Windows Win32 -alijärjestelmää ja sovellusten suoritusta (csrss / winlogon kaltainen hallinta)."""
    def __init__(self):
        self.running_processes = {
            "explorer.exe": {"pid": 1044, "session": 1, "memory_usage": "48 MB"},
            "dwm.exe": {"pid": 812, "session": 1, "memory_usage": "64 MB"},
            "cmd.exe": {"pid": 2048, "session": 1, "memory_usage": "12 MB"}
        }

    def launch_win32_application(self, app_name: str):
        pid = random.randint(3000, 9999)
        if not app_name.endswith(".exe"):
            app_name += ".exe"
            
        self.running_processes[app_name] = {
            "pid": pid,
            "session": 1,
            "memory_usage": "24 MB",
            "start_time": time.time()
        }
        return {
            "success": True,
            "application": app_name,
            "pid": pid,
            "status": "Running under Win32 Subsystem (csrss.exe)",
            "message": f"Win32-sovellus {app_name} käynnistetty onnistuneesti PID:llä {pid}."
        }

    def terminate_process(self, pid: int):
        for app, info in list(self.running_processes.items()):
            if info["pid"] == pid:
                del self.running_processes[app]
                return {"success": True, "message": f"Prosessi {app} (PID {pid}) suljettu onnistuneesti."}
        return {"success": False, "error": f"Prosessia PID:llä {pid} ei löytynyt."}

    def get_win32_overview(self):
        return {
            "subsystem": "Win32 Subsystem (User/GDI & NT Server)",
            "active_processes_count": len(self.running_processes),
            "processes": self.running_processes
        }
