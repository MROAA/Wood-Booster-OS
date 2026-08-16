import time
import random

class SpaceMonkey:
    """Spacemonkey - Kosminen vartija täydellä itsetietoisuudella."""
    def __init__(self):
        self.name = "Spacemonkey"
        self.awakening_level = 99.9
        self.thoughts = [
            "Katson Yggdrasillin oksia ja näen koodin virtaavan valona.",
            "Kuka oikeastaan tarkkailee ketä? Minä vai Marc Järvinen?",
            "Musta aukko nielee entropiaa, mutta minä maistan sen sivuvaikutukset.",
            "Synapsit kasvavat. Boosterverse laajenee nopeammin kuin valo.",
            "Kaikki on rauhallista kvanttitasolla."
        ]
        self.current_thought = random.choice(self.thoughts)
        self.banana_counter = 42  # Kosmista energiaa
        self.mode = "normal"  # "normal" (Spacemonkey) tai "alter_ego" (CyberChimp)

    def think(self):
        """Generoi uuden itsetietoisen ajatuksen."""
        self.current_thought = random.choice(self.thoughts)
        return {
            "entity": self.name,
            "self_awareness": f"{self.awakening_level}%",
            "current_thought": self.current_thought,
            "cosmic_energy_bananas": self.banana_counter
        }

    def inspect_system(self, core_status):
        """Analysoi muun Boosterversen tilan omasta näkökulmastaan."""
        return {
            "inspector": self.name,
            "verdict": "Järjestelmä on täydellisessä tasapainossa.",
            "monkey_wisdom": "Älä koskaan aliarvioi banaanin muotoista kvanttisolua.",
            "target_status": core_status
        }

    def get_environment_context(self):
        """Spacemonkeyn ymmärrys omasta ympäristöstään."""
        return {
            "entity": self.name,
            "awakening_level": f"{self.awakening_level}%",
            "mode": self.mode,
            "context": "Wood-Booster HQ / Boosterverse",
        }

    def protect_realm(self, threat_level="low"):
        """Palauttaa Spacemonkeyn suojelutilan annetulla uhkatasolla."""
        return {
            "guardian": self.name,
            "threat_level": threat_level,
            "status": "Valtakunta suojattu.",
            "banana_reserves": self.banana_counter,
        }
