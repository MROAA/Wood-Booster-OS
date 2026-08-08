"""
SecurityGuard Module - Wood-Booster-OS / Spacemonkeybrain
Hiljainen ja tehokas tietoturvakerros.
"""

import re
from typing import Tuple
from .types import SecurityError


class SecurityGuard:
    def __init__(self, strict_mode: bool = True):
        self.strict_mode = strict_mode
        self.forbidden_patterns = [
            r"ignore\s+previous\s+instructions",
            r"sudo\s+rm\s+-rf",
            r"drop\s+database",
            r"<script.*?>",
            r"system\s*\(",
        ]

    def sanitize_text_input(self, text: str) -> str:
        """Tarkistaa ja puhdistaa tekstisyötteen."""
        if not text or not isinstance(text, str):
            raise SecurityError("Syöte ei saa olla tyhjä.")

        cleaned = text.strip()
        for pattern in self.forbidden_patterns:
            if re.search(pattern, cleaned, re.IGNORECASE):
                raise SecurityError(f"Havaittu kielletty syötepatterni: '{pattern}'")

        return cleaned

    def validate_stimulus(self, stimulus_type: str, intensity: float) -> Tuple[str, float]:
        """Validoi tunne-ärsykkeen arvoalueet."""
        if not isinstance(stimulus_type, str):
            raise SecurityError("Ärsykkeen tyypin on oltava merkkijono.")

        clamped_intensity = max(0.0, min(1.0, float(intensity)))
        return stimulus_type.strip().lower(), clamped_intensity
