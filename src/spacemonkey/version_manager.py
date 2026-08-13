"""
IdentityVersionManager Module - Wood-Booster-OS / Spacemonkeybrain

Tarjoaa versionhallinta-, tilankaappaus- (snapshot) ja migraatiojärjestelmän
Spacemonkeyn monikerroksisille identiteeteille, persoonallisuusmoduuleille 
ja limbiselle järjestelmälle.
"""

from dataclasses import dataclass, field, asdict
import json
import os
import time
import hashlib
from typing import Dict, Any, List, Optional


@dataclass
class IdentityLayer:
    """Yksittäinen identiteetti- tai persoonallisuuskerros."""
    layer_name: str
    version: str
    attributes: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class IdentitySnapshot:
    """Spacemonkeyn koko tilan kaappaus (Snapshot)."""
    snapshot_id: str
    timestamp: float
    version_label: str
    description: str
    layers: Dict[str, Dict[str, Any]]
    checksum: str = ""

    def calculate_checksum(self) -> str:
        """Laskee SHA256-tarkistussumman eheystarkistusta varten."""
        data_str = json.dumps({
            "snapshot_id": self.snapshot_id,
            "version_label": self.version_label,
            "layers": self.layers
        }, sort_keys=True)
        return hashlib.sha256(data_str.encode('utf-8')).hexdigest()

    def verify_integrity(self) -> bool:
        """Tarkistaa, täsmääkö nykyinen tarkistussumma laskettuun."""
        return self.checksum == self.calculate_checksum()


class IdentityVersionManager:
    """
    Hallinnoi Spacemonkeyn kerroksellisia versioita, 
    tallentaa snapshotteja levyke- tai muistipohjaisesti ja tukee rollback-toimintoa.
    """

    def __init__(self, storage_dir: str = "./versions"):
        self.storage_dir = storage_dir
        self.history: List[IdentitySnapshot] = []
        self.active_snapshot_id: Optional[str] = None
        
        # Luodaan versiohakemisto, jos sitä ei ole vielä olemassa
        os.makedirs(self.storage_dir, exist_ok=True)

    def create_snapshot(
        self, 
        version_label: str, 
        layers: Dict[str, IdentityLayer], 
        description: str = ""
    ) -> IdentitySnapshot:
        """
        Luo uuden versiosnapshotin kaikista aktiivisista identiteettikerroksista.
        """
        timestamp = time.time()
        snapshot_id = f"v_{version_label}_{int(timestamp)}"
        
        # Muunnetaan IdentityLayer-oliot sanakirjamuotoon
        serialized_layers = {
            name: asdict(layer) for name, layer in layers.items()
        }

        snapshot = IdentitySnapshot(
            snapshot_id=snapshot_id,
            timestamp=timestamp,
            version_label=version_label,
            description=description,
            layers=serialized_layers
        )
        snapshot.checksum = snapshot.calculate_checksum()

        # Tallennetaan muistiin ja levylle
        self.history.append(snapshot)
        self.active_snapshot_id = snapshot_id
        self._save_to_file(snapshot)

        return snapshot

    def rollback_to(self, snapshot_id: str) -> Optional[IdentitySnapshot]:
        """
        Palaa määritettyyn aiempaan versioon turvallisesti.
        """
        for snapshot in self.history:
            if snapshot.snapshot_id == snapshot_id:
                if snapshot.verify_integrity():
                    self.active_snapshot_id = snapshot.snapshot_id
                    print(f"[VersionManager] Rollback onnistui versioon: {snapshot_id}")
                    return snapshot
                else:
                    print(f"[ERROR] Snapshot {snapshot_id} eheystarkistus epäonnistui!")
                    return None
        
        # Jos ei löydy muistista, yritetään ladata levyltä
        loaded = self._load_from_file(snapshot_id)
        if loaded and loaded.verify_integrity():
            self.history.append(loaded)
            self.active_snapshot_id = loaded.snapshot_id
            print(f"[VersionManager] Rollback onnistui levyltä versioon: {snapshot_id}")
            return loaded

        print(f"[ERROR] Versiota {snapshot_id} ei löytynyt.")
        return None

    def list_versions(self) -> List[Dict[str, Any]]:
        """Palauttaa yhteenvedon kaikista saatavilla olevista versioista."""
        return [
            {
                "snapshot_id": snap.snapshot_id,
                "version_label": snap.version_label,
                "timestamp": snap.timestamp,
                "description": snap.description,
                "is_active": snap.snapshot_id == self.active_snapshot_id
            }
            for snap in self.history
        ]

    def _save_to_file(self, snapshot: IdentitySnapshot) -> None:
        """Tallenna snapshot JSON-tiedostoon."""
        file_path = os.path.join(self.storage_dir, f"{snapshot.snapshot_id}.json")
        data = asdict(snapshot)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def _load_from_file(self, snapshot_id: str) -> Optional[IdentitySnapshot]:
        """Lataa snapshot JSON-tiedostosta."""
        file_path = os.path.join(self.storage_dir, f"{snapshot_id}.json")
        if not os.path.exists(file_path):
            return None
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return IdentitySnapshot(**data)
        except Exception as e:
            print(f"[ERROR] Tiedoston lataus epäonnistui ({file_path}): {e}")
            return None


if __name__ == "__main__":
    # Yksikkötestaus / toiminnan varmistus
    vm = IdentityVersionManager()

    # Määritetään esimerkkikerrokset (Core, Limbic, Persona)
    core_layer = IdentityLayer(
        layer_name="CoreIdentity",
        version="1.0.0",
        attributes={"base_model": "Spacemonkeybrain", "safety_mode": "STRICT"}
    )
    
    limbic_layer = IdentityLayer(
        layer_name="LimbicState",
        version="0.1.0",
        attributes={"valence": 0.2, "arousal": 0.5, "stress": 0.1}
    )

    layers = {
        "core": core_layer,
        "limbic": limbic_layer
    }

    # Luodaan versio v1.0.0
    snap1 = vm.create_snapshot("1.0.0", layers, "Initial Spacemonkey core snapshot")
    print("Luotu versio 1:", snap1.snapshot_id)

    # Muutetaan tilaa ja luodaan versio v1.1.0
    limbic_layer.attributes["stress"] = 0.8
    snap2 = vm.create_snapshot("1.1.0", layers, "High stress update")
    print("Luotu versio 2:", snap2.snapshot_id)

    # Listataan versiot
    print("\nKaikki versiot:")
    for v in vm.list_versions():
        print(" -", v)

    # Testataan Rollbackia takaisin versioon 1
    rolled_back = vm.rollback_to(snap1.snapshot_id)
    print("\nAktiivinen tila palautuksen jälkeen:", vm.active_snapshot_id)
