#!/usr/bin/env python3
"""
Wood-Booster OS - Hiiden Hirvi Module
Vikkeläjalkainen hirvi, joka pinkoo läpi metsien ja testaa järjestelmän tiedostohaun ja datansiirron huippunopeutta.
"""

class HiidenElk:
    """Hiiden hirvi juoksee karkuun metsissä ja testtaa suorituskykyä."""
    def __init__(self):
        self.speed_kmh = 300
        self.tracking_active = True

    def run_forest_dash(self):
        return f"Hiiden hirvi laukkaa vauhdilla {self.speed_kmh} km/h läpi Wood-Booster OS -tiedostojärjestelmän!"

    def catch_elk(self, hunter="Lemminkäinen"):
        return f"{hunter} sai Hiiden hirven kiinni! Datan haku ja indeksointi suoritettu ennätysajassa."


class ElkManager:
    """Hallinnoi Hiiden hirven vauhtia ja hakutoimintoja."""
    def __init__(self):
        self.elk = HiidenElk()

    def run_speed_test(self):
        print("--- Hiiden Hirvi: Nopeustesti ---")
        print(self.elk.run_forest_dash())
        print(self.elk.catch_elk("Lemminkäinen"))
        print("---------------------------------")


if __name__ == "__main__":
    manager = ElkManager()
    manager.run_speed_test()
