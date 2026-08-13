#!/usr/bin/env python3
"""
Wood-Booster OS - Väinämöisen Lähtö Module
Väinämöinen soutaa kuparisessa veneessään kohti taivaanrantaa ja jättää kanteleensa sekä laulunsa perinnöksi.
"""

class VäinämöinenDeparture:
    """Ikuinen tietäjä poistuu näyttämöltä ja jättää perinnön tuleville sukupolville."""
    def __init__(self):
        self.copper_boat_ready = True
        self.system_active = True

    def sail_away(self):
        self.system_active = False
        return "Väinämöinen astuu kupariseen veneeseensä ja soutaa kauas ulapalle – Wood-Booster OS sulkee prosessit hallitusti."

    def leave_legacy(self):
        return "Kannel ja laulut jäävät kansalle perinnöksi: koodikanta säilyy ikuisesti versionhallinnassa."


class DepartureManager:
    """Hallinnoi järjestelmän turvallista alasajoa ja perinnön jättämistä."""
    def __init__(self):
        self.departure = VäinämöinenDeparture()

    def run_shutdown_sequence(self):
        print("--- Väinämöisen Lähtö: Järjestelmän alasajo ---")
        print(self.departure.sail_away())
        print(self.departure.leave_legacy())
        print("---------------------------------------------")


if __name__ == "__main__":
    manager = DepartureManager()
    manager.run_shutdown_sequence()
