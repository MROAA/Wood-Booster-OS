import time

class Windows11TaskManager:
    """Simuloi Windows 11 Tehtävienhallintaa ja prosessien valvontaa."""
    def __init__(self):
        self.processes = [
            {"pid": 1044, "name": "explorer.exe", "cpu": "1.2%", "memory": "142 MB", "status": "Running"},
            {"pid": 2048, "name": "server.py", "cpu": "3.5%", "memory": "88 MB", "status": "Running"},
            {"pid": 3012, "name": "windows11_copilot.py", "cpu": "0.8%", "memory": "64 MB", "status": "Running"},
            {"pid": 4096, "name": "wood_booster_kernel", "cpu": "0.2%", "memory": "256 MB", "status": "Running"}
        ]
        self.performance_metrics = {
            "cpu_usage": "14%",
            "memory_usage": "32.4 GB / 64.0 GB (51%)",
            "disk_active_time": "1%",
            "uptime": "2 days, 14 hours"
        }

    def kill_process(self, pid: int):
        for i, proc in enumerate(self.processes):
            if proc["pid"] == pid:
                removed = self.processes.pop(i)
                return {
                    "success": True,
                    "message": f"Prosessi {removed["name"]} (PID: {pid}) lopetettu onnistuneesti.",
                    "processes": self.processes
                }
        return {"success": False, "error": "Prosessia annetulla PID-tunnuksella ei löytynyt."}

    def get_task_manager_overview(self):
        return {
            "component": "Windows 11 Task Manager",
            "performance": self.performance_metrics,
            "running_processes_count": len(self.processes),
            "processes": self.processes
        }
