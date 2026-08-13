import time
from datetime import datetime

class Windows11Calendar:
    """Simuloi Windows 11 Kalenteri- ja kello-sovellusta."""
    def __init__(self):
        self.events = [
            {"id": 1, "title": "Boosterverse Dev Meeting", "date": "2026-08-10", "time": "10:00"},
            {"id": 2, "title": "System Update Check", "date": "2026-08-12", "time": "14:00"}
        ]
        self.world_clocks = {"Oulu": "UTC+3", "New York": "UTC-4", "Tokyo": "UTC+9"}

    def add_event(self, title: str, date: str, time_val: str):
        new_id = len(self.events) + 1
        event = {"id": new_id, "title": title, "date": date, "time": time_val}
        self.events.append(event)
        return {"success": True, "message": f"Tapahtuma {title} lisätty kalenteriin.", "events": self.events}

    def get_calendar_overview(self):
        return {
            "component": "Windows 11 Calendar & Clock App",
            "current_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "upcoming_events": self.events,
            "world_clocks": self.world_clocks
        }
