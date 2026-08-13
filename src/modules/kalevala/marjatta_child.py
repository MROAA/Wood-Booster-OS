#!/usr/bin/env python3
"""
Wood-Booster OS - Marjatta and Child Module
Puolukan syönnistä alkunsa saava ihme: alustaa järjestelmän uuden pääversion ja kruunaa Karjalan kuninkaaksi.
"""

class MarjattaChild:
    """Marjatan poika syntyy ja tuo mukanaan uuden version aikakauden."""
    def __init__(self):
        self.version_ready = False

    def eat_lingonberry(self):
        return "Marjatta syö puolukan – järjestelmään latautuu täysin uusi, puhdas koodikanta."

    def crown_new_king(self):
        self.version_ready = True
        return "Poika kruunataan Karjalan kuninkaaksi! Wood-Booster OS siirtyy virallisesti uuteen sukupolveen."


class MarjattaManager:
    """Hallinnoi uuden version alustusta ja kruunajaisrutiinia."""
    def __init__(self):
        self.marjatta = MarjattaChild()

    def run_upgrade_routine(self):
        print("--- Marjatta ja Poika: Uuden sukupolven päivitys ---")
        print(self.marjatta.eat_lingonberry())
        print(self.marjatta.crown_new_king())
        print("--------------------------------------------------")


if __name__ == "__main__":
    manager = MarjattaManager()
    manager.run_upgrade_routine()
