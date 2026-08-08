"""
Spacemonkey Quiet Entrypoint - Wood-Booster-OS
Puhdas, rauhallinen ja selkeä päärajapinta.
"""

import sys
import os

# Lisätään src-hakemisto moduulipolkuun
sys.path.insert(0, os.path.abspath("./src"))

from spacemonkey.spc_facade import SpacemonkeyFacade
from spacemonkey.config_loader import ConfigLoader


class Spacemonkey:
    def __init__(self, name: str = "Spacemonkey"):
        self._facade = SpacemonkeyFacade(system_name=name)
        
        # Ladataan JSON-konfiguraatiot hiljaisesti
        loader = ConfigLoader()
        custom_layers = loader.load_identities()
        if custom_layers:
            self._facade.layers.update(custom_layers)

    def process(self, prompt: str) -> dict:
        """Käsittelee tekstisyötteen turvallisesti."""
        return self._facade.process_text_prompt(prompt)

    def stimulus(self, st_type: str, intensity: float) -> dict:
        """Syöttää tunne-ärsykkeen järjestelmään."""
        return self._facade.process_input_stimulus(st_type, intensity)

    def status(self) -> str:
        """Palauttaa rauhallisen ja erittäin kompaktin tilakatsauksen."""
        full = self._facade.get_full_status()
        pers = full["personality_profile"]
        sec = full["security_status"]
        
        return (
            f"--- {full['system_name']} Status ---\n"
            f"Mode:    {pers['primary_mode']}\n"
            f"Tone:    {pers['tone_of_voice']}\n"
            f"Safety:  {sec.get('status')} (Estetty: {sec.get('violations_blocked', 0)})\n"
            f"--------------------------------"
        )


if __name__ == "__main__":
    # Yksinkertainen ja rauhallinen testi
    app = Spacemonkey()
    print(app.status())
