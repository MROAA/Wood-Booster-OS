import time

class Windows11VirtualDesktops:
    """Simuloi Windows 11 virtuaalisia työpöytiä ja Task View -näkymää."""
    def __init__(self):
        self.desktops = [
            {"id": 1, "name": "Työpöytä 1", "active": True},
            {"id": 2, "name": "Työt", "active": False},
            {"id": 3, "name": "Pelit & Media", "active": False}
        ]

    def switch_desktop(self, desktop_id: int):
        found = False
        for desk in self.desktops:
            if desk["id"] == desktop_id:
                desk["active"] = True
                found = True
            else:
                desk["active"] = False
                
        if found:
            return {"success": True, "message": f"Vaihdettu työpöydälle ID: {desktop_id}", "desktops": self.desktops}
        return {"success": False, "error": "Työpöytää ei löytynyt."}

    def create_desktop(self, name: str):
        new_id = len(self.desktops) + 1
        new_desk = {"id": new_id, "name": name, "active": False}
        self.desktops.append(new_desk)
        return {"success": True, "message": f"Uusi työpöytä {name} luotu.", "desktops": self.desktops}

    def get_desktops_overview(self):
        return {
            "component": "Windows 11 Virtual Desktops & Task View",
            "desktops": self.desktops
        }
