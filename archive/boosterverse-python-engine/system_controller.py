import psutil
import platform
import subprocess

class SystemController:
    """Wood-Booster OS -käyttöjärjestelmän rautahallinta."""
    def __init__(self):
        self.os_name = platform.system()
        self.os_release = platform.release()

    def get_hardware_health(self):
        """Lukee raudan tilan (CPU/RAM)."""
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "ram_used_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage("/").percent,
            "os": f"{self.os_name} {self.os_release}"
        }

    def execute_maintenance(self):
        """Suorittaa rautatasoisen ylläpidon."""
        # Esimerkki: siivotaan väliaikaiset tiedostot
        try:
            subprocess.run(["sync"], check=True)
            return "Järjestelmän synkronointi suoritettu."
        except Exception as e:
            return f"Huolto epäonnistui: {e}"
