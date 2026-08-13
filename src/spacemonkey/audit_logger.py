"""
AuditLogger Module - Wood-Booster-OS / Spacemonkeybrain

Tallentaa järjestelmän kriittiset tapahtumat, estot ja tila-arvot
rakenteelliseen JSON-L-muotoon hiljaisesti ja luotettavasti.
"""

import json
import os
from datetime import datetime, timezone
from typing import Dict, Any


class AuditLogger:
    def __init__(self, log_file: str = "./audit.log"):
        self.log_file = log_file

    def log_event(self, event_type: str, status: str, details: Dict[str, Any]) -> None:
        """Kirjoittaa yksittäisen tapahtuman lokitiedostoon JSON-L-muodossa."""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "status": status,
            "details": details
        }
        
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception:
            # Pidetään lokitus suoritusvarmana ilman, että se kaataa pääsovellusta
            pass
