#!/usr/bin/env python3
"""
Wood-Booster OS - End-to-End Boot & Subsystem Integrator
Kokoaa yhteen ytimen, Win96-komponentit ja Kalevala-alijärjestelmän.
"""

import sys
import os

# Lisätään nykyinen hakemisto polkuun
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from modules.kalevala import KalevalaSubsystem

class WoodBoosterOS:
    """Wood-Booster OS End-to-End -pääjärjestelmä."""
    def __init__(self):
        self.version = "Win96 / Wood-Booster OS v2.0 (Epic Kalevala Edition)"
        self.kalevala = KalevalaSubsystem()

    def boot_sequence(self):
        print("==================================================")
        print(f"   KÄynnistetään {self.version}")
        print("==================================================")
        print("[OK] Ladataan ytimen muistinhallinta...")
        print("[OK] Alustetaan tiedostojärjestelmä (Dark Walnut Layout)...")
        print("[OK] Käynnistetään Win96 graafinen käyttöliittymä...")
        print("[OK] Aktivoidaan Kalevala-turva- ja tuotantomoduulit...")
        print("--------------------------------------------------")
        
        # Ajetaan eeppinen Kalevala-sykli osana boot-rutiinia
        self.kalevala.run_epic_chronicles()
        
        print("==================================================")
        print("   WOOD-BOOSTER OS ON VALMIS KÄYTTÖÖN.           ")
        print("==================================================")

if __name__ == "__main__":
    os_system = WoodBoosterOS()
    os_system.boot_sequence()
