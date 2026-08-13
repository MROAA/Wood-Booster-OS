#!/usr/bin/env python3
"""
Wood-Booster OS - Imatra Rapids Module
Kuohuva Imatran koski: testaa järjestelmän verkkoliikenteen kuormitusta, pakettien virtausta ja tiedonsiirron nopeutta.
"""

class ImatraRapids:
    """Koski viruuttaa dataa ja testaa ytimen kykyä käsitellä massiivisia tietomääriä."""
    def __init__(self):
        self.water_flow_rate = 5000  # kuutiota sekunnissa / datapakettia sekunnissa
        self.dam_open = True

    def unleash_torrent(self):
        return f"Imatran koski aukeaa! Datavyöry virtaa vauhdilla {self.water_flow_rate} pakettia/s läpi järjestelmän."

    def regulate_flow(self, new_rate):
        self.water_flow_rate = new_rate
        return f"Kosken virtausta on säädetty: uusi nopeus on {self.water_flow_rate} pakettia/s."


class RapidsManager:
    """Hallinnoi Imatran kosken kuormitustestejä ja virtausta."""
    def __init__(self):
        self.rapids = ImatraRapids()

    def run_load_test(self):
        print("--- Imatran Koski: Verkon kuormitustesti ---")
        print(self.rapids.unleash_torrent())
        print(self.rapids.regulate_flow(8000))
        print("---------------------------------------------")


if __name__ == "__main__":
    manager = RapidsManager()
    manager.run_load_test()
