#!/usr/bin/env python3
"""
Wood-Booster OS - Joukahainen Contest Module
Kilpailu- ja benchmark-moottori, joka haastaa järjestelmän ytimen ja testaa suorituskykyä.
"""

class JoukahainenContest:
    """Nuori Joukahainen haastaa vanhan ja viisaan ytimen laulukilpailuun (benchmark)."""
    def __init__(self):
        self.hubris_level = 100

    def challenge_kernel(self):
        return "Joukahainen haastaa ytimen kilpaan: 'Katsotaan kumpi koodaa syvemmälle suohon!'"

    def sink_in_bog(self):
        self.hubris_level = 0
        return "Joukahainen häviää kilpailun ja uppoaa sanatulvaan! Suo nielaisee liian optimistiset muistivaraukset."


class ContestManager:
    """Hallinnoi suorituskykytestejä ja ytimen kilpailutilanteita."""
    def __init__(self):
        self.contest = JoukahainenContest()

    def run_benchmark(self):
        print("--- Joukahaisen Kilpa: Suorituskykytesti ---")
        print(self.contest.challenge_kernel())
        print(self.contest.sink_in_bog())
        print("------------------------------------------")


if __name__ == "__main__":
    manager = ContestManager()
    manager.run_benchmark()
