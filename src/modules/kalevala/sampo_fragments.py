#!/usr/bin/env python3
"""
Wood-Booster OS - Sampo Fragments Module
Sammon sirpaleiden keruu ja eheytys: palauttaa hajautetut tiedot ja korjaa vioittuneet levysektorit.
"""

class SampoFragments:
    """Kerää merestä ja maasta löytyvät Sammon sirpaleet takaisin yhteen."""
    def __init__(self):
        self.fragments_collected = 0
        self.restored = False

    def collect_fragment(self):
        self.fragments_collected += 1
        return f"Sirpale #{self.fragments_collected} nostettu merestä! Tiedosto-osio eheytetään."

    def restore_system_integrity(self):
        if self.fragments_collected > 0:
            self.restored = True
            return "Sammon sirpaleet on koottu yhteen – Wood-Booster OS on palautettu täyteen toimintakuntoon!"
        return "Ei sirpaleita koottuna."


class FragmentsManager:
    """Hallinnoi sirpaleiden keräystä ja järjestelmän eheyttämistä."""
    def __init__(self):
        self.fragments = SampoFragments()

    def run_restoration_routine(self):
        print("--- Sammon Sirpaleet: Järjestelmän eheytys ---")
        print(self.fragments.collect_fragment())
        print(self.fragments.collect_fragment())
        print(self.fragments.restore_system_integrity())
        print("---------------------------------------------")


if __name__ == "__main__":
    manager = FragmentsManager()
    manager.run_restoration_routine()
