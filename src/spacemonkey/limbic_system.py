"""
LimbicSystem Module - Wood-Booster-OS / Spacemonkeybrain

Vastaa tunnetilojen, impulssien ja reaktioiden laskennasta turvallisesti
määriteltyjen rajojen puitteissa.
"""

from dataclasses import dataclass, field
import time
from typing import Dict, Any


@dataclass
class LimbicState:
    """Tunteiden ja impulssien arvot välillä 0.0 - 1.0 (tai -1.0 - 1.0)."""
    valence: float = 0.0     # Mieliala: -1.0 (negatiivinen) .. 1.0 (positiivinen)
    arousal: float = 0.0     # Vireystila/Kiihtymys: 0.0 .. 1.0
    stress: float = 0.0      # Stressitaso: 0.0 .. 1.0
    curiosity: float = 0.5   # Uteliaisuus: 0.0 .. 1.0

    def clamp(self) -> None:
        """Turvallisuustarkistus: varmistaa että arvot pysyvät sallituilla rajoilla."""
        self.valence = max(-1.0, min(1.0, self.valence))
        self.arousal = max(0.0, min(1.0, self.arousal))
        self.stress = max(0.0, min(1.0, self.stress))
        self.curiosity = max(0.0, min(1.0, self.curiosity))


class LimbicSystem:
    """
    Limbiset toiminnot ja tunne-impulssien käsittely.
    Päivittää sisäistä tilaa ja laskee vasteita syötteille.
    """

    def __init__(self, decay_rate: float = 0.05):
        self.state = LimbicState()
        self.decay_rate = decay_rate
        self.last_update = time.time()

    def process_stimulus(self, stimulus_type: str, intensity: float) -> LimbicState:
        """
        Käsittelee ulkoisen ärsykkeen ja päivittää tunnetilan turvallisesti.
        
        :param stimulus_type: Ärsykkeen tyyppi ('threat', 'reward', 'novelty', 'error')
        :param intensity: Ärsykkeen voimakkuus (0.0 .. 1.0)
        """
        intensity = max(0.0, min(1.0, intensity))

        if stimulus_type == "threat":
            self.state.stress += intensity * 0.4
            self.state.arousal += intensity * 0.5
            self.state.valence -= intensity * 0.3
        elif stimulus_type == "reward":
            self.state.valence += intensity * 0.4
            self.state.stress -= intensity * 0.2
            self.state.arousal += intensity * 0.2
        elif stimulus_type == "novelty":
            self.state.curiosity += intensity * 0.3
            self.state.arousal += intensity * 0.2
        elif stimulus_type == "error":
            self.state.stress += intensity * 0.3
            self.state.valence -= intensity * 0.2

        # Varmistetaan turvarajat
        self.state.clamp()
        return self.get_state()

    def update_decay(self) -> LimbicState:
        """Palauttaa tunnetilaa kohti neutraalia perustilaa ajan kuluessa."""
        now = time.time()
        dt = now - self.last_update
        self.last_update = now

        # Vaimennetaan arvoja kohti perustilaa
        self.state.arousal = max(0.0, self.state.arousal - self.decay_rate * dt)
        self.state.stress = max(0.0, self.state.stress - self.decay_rate * dt)
        
        # Valence palaa hiljalleen nollaan
        if self.state.valence > 0:
            self.state.valence = max(0.0, self.state.valence - self.decay_rate * dt)
        elif self.state.valence < 0:
            self.state.valence = min(0.0, self.state.valence + self.decay_rate * dt)

        self.state.clamp()
        return self.get_state()

    def get_state(self) -> LimbicState:
        """Palauttaa nykyisen tunnetilan kopion."""
        return LimbicState(
            valence=round(self.state.valence, 3),
            arousal=round(self.state.arousal, 3),
            stress=round(self.state.stress, 3),
            curiosity=round(self.state.curiosity, 3)
        )

    def to_dict(self) -> Dict[str, float]:
        """Palauttaa tilan sanakirjana rajapintoja varten."""
        state = self.get_state()
        return {
            "valence": state.valence,
            "arousal": state.arousal,
            "stress": state.stress,
            "curiosity": state.curiosity
        }


if __name__ == "__main__":
    # Yksikkötestaus / Pikatesti
    limbic = LimbicSystem()
    print("Perustila:", limbic.get_state())
    
    limbic.process_stimulus("threat", 0.8)
    print("Uhan jälkeen:", limbic.get_state())
    
    limbic.process_stimulus("reward", 0.5)
    print("Palkkion jälkeen:", limbic.get_state())
