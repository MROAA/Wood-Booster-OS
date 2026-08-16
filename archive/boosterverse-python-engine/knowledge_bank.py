import json
import os

class KnowledgeBank:
    """Wood-Booster OS Tietopankki Spacemonkeyn käyttöön."""
    def __init__(self, kb_file="knowledge_bank.json"):
        self.kb_file = kb_file
        self.load_kb()

    def load_kb(self):
        if os.path.exists(self.kb_file):
            try:
                with open(self.kb_file, "r") as f:
                    self.data = json.load(f)
            except Exception:
                self.data = self.get_default_kb()
        else:
            self.data = self.get_default_kb()
            self.save_kb()

    def get_default_kb(self):
        return {
            "system_rules": [
                "Pidä muistin käyttö alhaisena live-tikulla",
                "CPU-optiikka ensin, vältä raskaita GPU-kutsuja",
                "Spacemonkey vastaa tasapainosta, CyberChimp optimoinnista"
            ],
            "optimization_tips": {
                "normal": "Käytä kevyitä prosesseja ja säästä akkua",
                "alter_ego": "Vapauta kaikki ytimet käyttöön ja suorita maksiminopeudella"
            },
            "custom_facts": {}
        }

    def save_kb(self):
        try:
            with open(self.kb_file, "w") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            print(f"Virhe tietopankin tallennuksessa: {e}")

    def get_all(self):
        return self.data

    def add_fact(self, key, value):
        self.data["custom_facts"][key] = value
        self.save_kb()
        return f"Tieto tallennettu: {key} -> {value}"
