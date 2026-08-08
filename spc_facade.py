"""
SpacemonkeyFacade Module - Wood-Booster-OS / Spacemonkeybrain

Päärajapinta (Facade), joka yhdistää LimbicSystemin, IdentityVersionManagerin 
ja PersonalityCoren olemassa olevien identiteettikerrosten kanssa.
"""

import logging
from typing import Dict, Any, List, Optional

# Tuodaan moduulit
from limbic_system import LimbicSystem, LimbicState
from version_manager import IdentityVersionManager, IdentityLayer, IdentitySnapshot
from personality_core import PersonalityCore, PersonalityProfile

logging.basicConfig(level=logging.INFO, format="[Facade] %(asctime)s - %(levelname)s - %(message)s")


class SpacemonkeyFacade:
    """
    Facade-rajapinta, joka kytkee olemassa olevat identiteettikerrokset,
    limbisen järjestelmän ja persoonallisuusytimen yhtenäiseksi moottoriksi.
    """

    def __init__(self, system_name: str = "SpacemonkeyCore", storage_dir: str = "./versions"):
        self.system_name = system_name
        self.limbic = LimbicSystem()
        self.personality_core = PersonalityCore()
        self.version_manager = IdentityVersionManager(storage_dir=storage_dir)
        
        # Alustetaan/Ladataan olemassa olevat identiteettikerrokset
        self.layers: Dict[str, IdentityLayer] = {
            "core": IdentityLayer(
                layer_name="CoreIdentity",
                version="1.0.0",
                attributes={"name": self.system_name, "status": "ACTIVE", "safety_mode": "STRICT"}
            ),
            "limbic": IdentityLayer(
                layer_name="LimbicState",
                version="0.1.0",
                attributes=self.limbic.to_dict()
            )
        }
        
        # Luodaan aloitussnapshot
        self.save_snapshot("0.1.0-init", "Initial Facade & PersonalityCore snapshot")
        logging.info(f"SpacemonkeyFacade + PersonalityCore alustettu nimellä '{self.system_name}'.")

    def process_input_stimulus(self, stimulus_type: str, intensity: float) -> Dict[str, Any]:
        """Käsittelee syötteen ja päivittää tunne- sekä persoonallisuusprofiilin."""
        intensity = max(0.0, min(1.0, float(intensity)))
        self.limbic.process_stimulus(stimulus_type, intensity)
        self.layers["limbic"].attributes = self.limbic.to_dict()
        return self.get_full_status()

    def get_personality_profile(self) -> PersonalityProfile:
        """Laskee ja palauttaa dynamisen persoonallisuusprofiilin olemassa olevista kerroksista."""
        return self.personality_core.compute_profile(self.limbic.get_state(), self.layers)

    def save_snapshot(self, version_label: str, description: str = "") -> IdentitySnapshot:
        """Tallentaa nykyiset identiteettikerrokset ja tilat versiosnapshotiksi."""
        self.layers["limbic"].attributes = self.limbic.to_dict()
        return self.version_manager.create_snapshot(
            version_label=version_label,
            layers=self.layers,
            description=description
        )

    def get_full_status(self) -> Dict[str, Any]:
        """Palauttaa järjestelmän tilan sekä aktiivisen persoonallisuusprofiilin."""
        profile = self.get_personality_profile()
        return {
            "system_name": self.system_name,
            "active_snapshot": self.version_manager.active_snapshot_id,
            "limbic_state": self.limbic.to_dict(),
            "personality_profile": {
                "primary_mode": profile.primary_mode,
                "tone_of_voice": profile.tone_of_voice,
                "creativity_index": profile.creativity_index,
                "risk_tolerance": profile.risk_tolerance,
                "directives": profile.active_directives
            },
            "layers_summary": [layer.layer_name for layer in self.layers.values()]
        }


if __name__ == "__main__":
    facade = SpacemonkeyFacade(system_name="SpacemonkeyBrain-V2")

    print("\n--- Aloitustila ja Persoonallisuus ---")
    status = facade.get_full_status()
    print("Mode:", status["personality_profile"]["primary_mode"])
    print("Tone:", status["personality_profile"]["tone_of_voice"])

    print("\n--- Syötetään 'novelty' (0.9) ---")
    facade.process_input_stimulus("novelty", 0.9)
    status_updated = facade.get_full_status()
    print("Uusi Mode:", status_updated["personality_profile"]["primary_mode"])
    print("Uusi Tone:", status_updated["personality_profile"]["tone_of_voice"])
    print("Creativity Index:", status_updated["personality_profile"]["creativity_index"])
