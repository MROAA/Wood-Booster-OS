"""
SpacemonkeyFacade Module - Wood-Booster-OS / Spacemonkeybrain

Päärajapinta (Facade), joka yhdistää LimbicSystemin, IdentityVersionManagerin 
ja persoonallisuuskerrokset turvalliseksi ja moduuliseksi kokonaisuudeksi.
"""

import logging
from typing import Dict, Any, Optional, List

# Tuodaan aiemmin luodut moduulit
from limbic_system import LimbicSystem, LimbicState
from version_manager import IdentityVersionManager, IdentityLayer, IdentitySnapshot

# Määritetään lokitus turvallisuus- ja tilatapahtumille
logging.basicConfig(level=logging.INFO, format="[Facade] %(asctime)s - %(levelname)s - %(message)s")


class SpacemonkeyFacade:
    """
    Facade-rajapinta Spacemonkeybrain-persoonallisuus- ja tunnejärjestelmälle.
    Tarjoaa yhdenmukaistetun ja turvallisen liittymän ulkopuolisille moduuleille.
    """

    def __init__(self, system_name: str = "SpacemonkeyCore", storage_dir: str = "./versions"):
        self.system_name = system_name
        self.limbic = LimbicSystem()
        self.version_manager = IdentityVersionManager(storage_dir=storage_dir)
        
        # Alustetaan perusidentiteettikerrokset
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
        self.save_snapshot("0.1.0-init", "Initial Facade initialization snapshot")
        logging.info(f"SpacemonkeyFacade alustettu onnistuneesti nimellä '{self.system_name}'.")

    # --- TUNNETILA & ÄRSYKKET (LIMBIC INTERFACE) ---

    def process_input_stimulus(self, stimulus_type: str, intensity: float) -> Dict[str, Any]:
        """
        Prosessoitu syöte / ärsyke limbiselle järjestelmälle turvatarkastettuna.
        
        :param stimulus_type: 'threat', 'reward', 'novelty', 'error'
        :param intensity: Ärsykkeen voimakkuus (0.0 - 1.0)
        """
        # Turvallisuus- ja rajatarkistus
        intensity = max(0.0, min(1.0, float(intensity)))
        
        logging.info(f"Käsitellään ärsyke: {stimulus_type} (voimakkuus: {intensity})")
        updated_state = self.limbic.process_stimulus(stimulus_type, intensity)
        
        # Päivitetään kerroksen tiedot
        self.layers["limbic"].attributes = self.limbic.to_dict()

        return self.get_full_status()

    def tick_time_decay(self) -> Dict[str, Any]:
        """Aikaan perustuva tunnetilan laantuminen (decay)."""
        self.limbic.update_decay()
        self.layers["limbic"].attributes = self.limbic.to_dict()
        return self.get_full_status()

    # --- VERSIONHALLINTA & TURVATILAT (VERSIONING INTERFACE) ---

    def save_snapshot(self, version_label: str, description: str = "") -> IdentitySnapshot:
        """Tallenna nykyinen tila versiosnapshotiksi."""
        # Päivitetään limbiset attribuutit ennen tallennusta
        self.layers["limbic"].attributes = self.limbic.to_dict()
        
        snapshot = self.version_manager.create_snapshot(
            version_label=version_label,
            layers=self.layers,
            description=description
        )
        logging.info(f"Snapshot tallennettu: {snapshot.snapshot_id}")
        return snapshot

    def rollback_to_snapshot(self, snapshot_id: str) -> bool:
        """Palauta tila määritettyyn aiempaan versioon."""
        snapshot = self.version_manager.rollback_to(snapshot_id)
        if snapshot and snapshot.verify_integrity():
            # Palautetaan kerrosten tila
            if "limbic" in snapshot.layers:
                limbic_attrs = snapshot.layers["limbic"].get("attributes", {})
                self.limbic.state = LimbicState(
                    valence=limbic_attrs.get("valence", 0.0),
                    arousal=limbic_attrs.get("arousal", 0.0),
                    stress=limbic_attrs.get("stress", 0.0),
                    curiosity=limbic_attrs.get("curiosity", 0.5)
                )
            logging.info(f"Tila palautettu versioon {snapshot_id}")
            return True
        
        logging.error(f"Palautus versioon {snapshot_id} epäonnistui.")
        return False

    # --- TILANKYSELYT (STATUS INTERFACE) ---

    def get_full_status(self) -> Dict[str, Any]:
        """Palauttaa koko järjestelmän nykytilan ja aktiivisen version."""
        return {
            "system_name": self.system_name,
            "active_snapshot": self.version_manager.active_snapshot_id,
            "limbic_state": self.limbic.to_dict(),
            "layers_summary": [layer.layer_name for layer in self.layers.values()]
        }

    def list_history(self) -> List[Dict[str, Any]]:
        """Palauttaa taltioidut versiot."""
        return self.version_manager.list_versions()


if __name__ == "__main__":
    # Facade Pikatesti
    facade = SpacemonkeyFacade(system_name="SpacemonkeyBrain-V1")

    print("\n--- Aloitustila ---")
    print(facade.get_full_status())

    print("\n--- Syötetään 'novelty'-ärsyke ---")
    facade.process_input_stimulus("novelty", 0.7)
    print(facade.get_full_status())

    print("\n--- Luodaan uusi Snapshot ---")
    snap = facade.save_snapshot("0.2.0-novelty", "After novelty stimulus")

    print("\n--- Versiohistoria ---")
    for v in facade.list_history():
        print(" -", v)
