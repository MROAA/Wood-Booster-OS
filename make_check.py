#!/usr/bin/env python3
"""
Make Check - Wood-Booster-OS
Ajaa järjestelmän kuntotarkastuksen ja testisarjan.
"""

import unittest
import sys
import os

# Lisätään src moduulipolkuun
sys.path.insert(0, os.path.abspath("./src"))


def run_checks():
    print("=" * 50)
    print("   SPACEMONKEY CORE - HEALTH CHECK & TESTS")
    print("=" * 50)

    # 1. Ajetaan automaattitestit
    print("\n[1/2] Suoritetaan automaattiset unittest-testit...")
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir="tests", pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=1)
    result = runner.run(suite)

    if not result.wasSuccessful():
        print("\n[VIRHE] Testit epäonnistuivat! Korjaa virheet ennen jatkamista.")
        sys.exit(1)

    # 2. Varmistetaan tiedostostruktuuri
    print("\n[2/2] Tarkistetaan kriittiset tiedostot...")
    required_files = [
        "src/spacemonkey/spc_facade.py",
        "src/spacemonkey/security_guard.py",
        "src/spacemonkey/limbic_system.py",
        "src/spacemonkey/personality_core.py",
        "src/spacemonkey/types.py",
        "src/spacemonkey/audit_logger.py",
        "spc.py",
        "spc_cli.py"
    ]

    missing = []
    for filepath in required_files:
        if not os.path.exists(filepath):
            missing.append(filepath)

    if missing:
        print(f"\n[VIRHE] Puuttuvia tiedostoja havaittu: {missing}")
        sys.exit(1)

    print(" -> Kaikki vaaditut moduulit ja tiedostot löydetty.")
    print("\n" + "=" * 50)
    print("   TARKASTUS VALMIS: JÄRJESTELMÄ 100% KUNNOSSA!")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    run_checks()
