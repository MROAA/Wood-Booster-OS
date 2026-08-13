"""
ConfigLoader Module - Wood-Booster-OS / Spacemonkeybrain

Lataa ja validoi identiteetti- ja suojakonfiguraatiot JSON-tiedostoista.
"""

import json
import os
import logging
from typing import Dict, Any

from .version_manager import IdentityLayer

logging.basicConfig(level=logging.ERROR)


class ConfigLoader:
    def __init__(self, config_dir: str = "./config"):
        self.config_dir = config_dir

    def load_identities(self) -> Dict[str, IdentityLayer]:
        file_path = os.path.join(self.config_dir, "identities.json")
        if not os.path.exists(file_path):
            return {}

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        layers = {}
        for key, raw_layer in data.get("layers", {}).items():
            layers[key] = IdentityLayer(
                layer_name=raw_layer.get("layer_name", key),
                version=raw_layer.get("version", "1.0.0"),
                attributes=raw_layer.get("attributes", {})
            )
        return layers

    def load_security_rules(self) -> Dict[str, Any]:
        file_path = os.path.join(self.config_dir, "security_rules.json")
        if not os.path.exists(file_path):
            return {}

        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
