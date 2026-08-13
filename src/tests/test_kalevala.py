#!/usr/bin/env python3
"""
Wood-Booster OS - Kalevala Unit Tests
Testaa kaikkien Kalevala-moduulien olemassaolon ja perustoiminnot.
"""

import unittest
import sys
import os

# Lisätään src-hakemisto polkuun
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from modules.kalevala import KalevalaSubsystem


class TestKalevalaSubsystem(unittest.TestCase):
    """Testaa Kalevala-alijärjestelmän alustuksen ja komponentit."""

    def setUp(self):
        self.subsystem = KalevalaSubsystem()

    def test_subsystem_initialization(self):
        """Varmistaa, että alijärjestelmä lataa moduulit onnistuneesti."""
        self.assertGreater(len(self.subsystem.modules), 0, "Kalevala-moduuleja ei löytynyt!")

    def test_epic_run_execution(self):
        """Testaa, että eeppinen ajosykli suoriutuu ilman poikkeuksia."""
        try:
            self.subsystem.run_epic_chronicles()
        except Exception as e:
            self.fail(f"run_epic_chronicles epäonnistui virheeseen: {e}")


if __name__ == "__main__":
    unittest.main()
