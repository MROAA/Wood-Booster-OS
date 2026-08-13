#!/usr/bin/env python3
"""
Wood-Booster OS - Kalevala Core Module
Yhdistää muinaisen taruston järjestelmän hallintaan ja resurssien luontiin.
"""

class SampoGenerator:
    """Sampo-moottori, joka jauhaa vaurautta, kultaa ja ytimen resursseja."""
    def __init__(self):
        self.grind_count = 0
        self.output_resources = ["Kultaa", "Viljaa", "Suolaa", "Järjestelmän elinvoimaa"]

    def grind(self):
        self.grind_count += 1
        resource = self.output_resources[self.grind_count % len(self.output_resources)]
        return f"Sampo jauhaa: {resource} (Kierros {self.grind_count})"


class VainamoinenVoiceEngine:
    """Väinämöisen laulu: upottaa virheet ja ongelmat syvälle suohoon."""
    def __init__(self):
        self.magic_power = 100

    def sing_spell(self, target_bug):
        if self.magic_power > 0:
            self.magic_power -= 10
            return f"Väinämöinen laulaa ja upottaa virheen '{target_bug}' syvälle suohoon! (Voimaa jäljellä: {self.magic_power}%)"
        return "Väinämöisen ääni väsyy, vaaditaan uusi runo."


class PohjolaGateway:
    """Pohjolan portti: vartioi järjestelmän rajapintoja ja turvallisuutta."""
    def __init__(self, owner="Louhi"):
        self.owner = owner
        self.gate_open = False

    def challenge(self, visitor):
        if visitor in ["Ilmarinen", "Väinämöinen", "Marc"]:
            self.gate_open = True
            return f"Pohjolan portti aukeaa vieraalle: {visitor}."
        self.gate_open = False
        return f"Pohjolan portti pysyy suljettuna! Vartija {self.owner} vaatii lunnaita."


class KalevalaSystemManager:
    """Pääluokka, joka hallinnoi Kalevala-moduuleja Wood-Booster OS -ympäristössä."""
    def __init__(self):
        self.sampo = SampoGenerator()
        self.vainamoinen = VainamoinenVoiceEngine()
        self.pohjola = PohjolaGateway()

    def run_status_check(self):
        print("--- Kalevala System Status ---")
        print(self.sampo.grind())
        print(self.vainamoinen.sing_spell("Muistivuoto (Memory Leak)"))
        print(self.pohjola.challenge("Marc"))
        print("------------------------------")


if __name__ == "__main__":
    manager = KalevalaSystemManager()
    manager.run_status_check()
