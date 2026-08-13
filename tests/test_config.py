"""
ConfigValidator Test Suite - Wood-Booster-OS
Varmistaa, etta JSON-konfiguraatioiden validointi toimii virheettomasti.
"""

import sys
import os
import unittest

# Lisataan src moduulipolkuun
sys.path.insert(0, os.path.abspath("./src"))

from spacemonkey.config_validator import ConfigValidator


class TestConfigValidator(unittest.TestCase):

    def test_existing_config_validation(self):
        """Varmistaa, etta olemassa oleva identities.json validoidaan oikein."""
        valid, errors = ConfigValidator.validate_identity_json("./config/identities.json")
        self.assertTrue(valid, f"Konfiguraatiossa virheita: {errors}")
        self.assertEqual(len(errors), 0)

    def test_missing_config_handling(self):
        """Varmistaa, etta puuttuva tiedosto kasitellaan sallitusti."""
        valid, errors = ConfigValidator.validate_identity_json("./config/non_existent.json")
        self.assertTrue(valid)
        self.assertEqual(len(errors), 0)


if __name__ == "__main__":
    unittest.main()
