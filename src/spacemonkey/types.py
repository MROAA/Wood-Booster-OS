"""
Types and Exceptions - Wood-Booster-OS / Spacemonkeybrain
Laitoksen yhteiset tyyppimääritykset ja rauhallinen virheenrahallinta.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any, Optional


class SafetyLevel(str, Enum):
    STRICT = "STRICT"
    BALANCED = "BALANCED"
    PERMISSIVE = "PERMISSIVE"


class SpacemonkeyError(Exception):
    """Järjestelmän kantapoikkeus rauhalliseen virheidenkäsittelyyn."""
    pass


class SecurityError(SpacemonkeyError):
    """Heitetään, kun tietoturvasääntöjä rikotaan."""
    pass


class StateError(SpacemonkeyError):
    """Heitetään, jos järjestelmän tila on epäselvä tai virheellinen."""
    pass


@dataclass
class ProcessResult:
    """Standardoitu ja selkeä vastaussäiliö kaikkialle järjestelmään."""
    status: str
    message: str
    details: Optional[Dict[str, Any]] = None

    def is_success(self) -> bool:
        return self.status == "ALLOWED" or self.status == "SUCCESS"
