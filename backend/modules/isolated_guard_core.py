import re
import time
from typing import Dict, Any

class IsolatedGuardCore:
    """
    Täysin itsenäinen turva- ja suojelumoduuli (Altrako Core Engine).
    Voidaan liittää APIin tai mihin tahansa rakenteeseen myöhemmin.
    """
    def __init__(self):
        self.blocked_count = 0
        self.audit_log = []
        self.forbidden_patterns = [
            r"sudo\s+rm\s+-rf",
            r"mkfs\.",
            r":\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\};\s*:"
        ]

    def inspect_payload(self, text: str) -> Dict[Any, Any]:
        """
        Tutkii syötteen ja tarkistaa, onko kyseessä uhka.
        Palauttaa tiedon siitä, sallitaanko komento vai ei.
        """
        for pattern in self.forbidden_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                self.blocked_count += 1
                event = {
                    "timestamp": time.time(),
                    "type": "THREAT_BLOCKED",
                    "pattern": pattern,
                    "snippet": text[:100]
                }
                self.audit_log.append(event)
                
                return {
                    "safe": False,
                    "guardian": "Altrako (Isolated Core Guardian 🐵🛡️)",
                    "message": f"BANAANI-PALOMUURI ISKI! Estetty vaarallinen yritys (osuma: '{pattern}').",
                    "blocked_total": self.blocked_count
                }

        return {
            "safe": True,
            "guardian": "Altrako (Isolated Core Guardian 🐵🛡️)",
            "message": "Komento hyväksytty. Ydin on turvassa!"
        }

    def get_status(self) -> Dict[Any, Any]:
        """Palauttaa suojelijan tilastot ja lokit tulevaa API-kytkentää varten."""
        return {
            "status": "active",
            "total_blocked": self.blocked_count,
            "recent_events": self.audit_log[-5:]  # Viimeiset 5 tapahtumaa
        }

# Globaali instanssi, joka odottaa tulevaa API-integraatiota
altrako_core = IsolatedGuardCore()
