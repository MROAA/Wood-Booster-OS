import time

class Windows11ActionCenter:
    """Simuloi Windows 11 ilmoituskeskusta ja pika-asetuksia."""
    def __init__(self):
        self.notifications = [
            {"id": 1, "app": "Windows Update", "title": "Päivitykset valmiina", "message": "Uusia turvapäivityksiä ladattu.", "time": "5m sitten"},
            {"id": 2, "app": "OneDrive", "title": "Synkronointi valmis", "message": "Kaikki tiedostot ajan tasalla.", "time": "1t sitten"}
        ]
        self.quick_settings = {
            "wifi": True,
            "bluetooth": True,
            "do_not_disturb": False,
            "night_light": True,
            "airplane_mode": False
        }

    def toggle_setting(self, setting_name: str):
        if setting_name in self.quick_settings:
            self.quick_settings[setting_name] = not self.quick_settings[setting_name]
            return {
                "success": True,
                "message": f"Pika-asetus {setting_name} vaihdettu.",
                "quick_settings": self.quick_settings
            }
        return {"success": False, "error": "Pika-asetusta ei löytynyt."}

    def clear_notifications(self):
        self.notifications = []
        return {
            "success": True,
            "message": "Kaikki ilmoitukset tyhjennetty.",
            "notifications": self.notifications
        }

    def get_action_center_overview(self):
        return {
            "component": "Windows 11 Action Center & Quick Settings",
            "notifications_count": len(self.notifications),
            "notifications": self.notifications,
            "quick_settings": self.quick_settings
        }
