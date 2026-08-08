"""
ConfigValidator Module - Wood-Booster-OS / Spacemonkeybrain

Varmistaa JSON-asetustiedostojen oikeellisuuden ennen niiden lataamista.
"""

import json
import os
from typing import Dict, Any, List, Tuple


class ConfigValidator:
    
    @staticmethod
    def validate_identity_json(filepath: str) -> Tuple[bool, List[str]]:
        """Tarkistaa identities.json -tiedostorakenteen."""
        errors = []
        if not os.path.exists(filepath):
            return True, []  # Valinnainen tiedosto

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            if not isinstance(data, dict):
                errors.append("Juurielementin tulee olla JSON-objekti (dict).")
            elif "layers" in data and not isinstance(data["layers"], dict):
                errors.append("'layers'-kentän tulee olla JSON-objekti.")

        except json.JSONDecodeError as e:
            errors.append(f"Syntaksivirhe JSON-tiedostossa: {str(e)}")
        except Exception as e:
            errors.append(f"Luku-virhe: {str(e)}")

        return len(errors) == 0, errors
