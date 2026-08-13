#!/usr/bin/env python3
"""
Wood-Booster OS - Kalevala Subsystem Master Index
Dynaaminen lataaja, joka kerää kaikki moduulit talteen riippumatta luokkien nimistä.
"""

import os
import importlib

class KalevalaSubsystem:
    """Lataa ja hallinnoi kaikkia Kalevala-moduuleja dynaamisesti."""
    def __init__(self):
        self.modules = []
        package_dir = os.path.dirname(__file__)
        
        # Käydään läpi kaikki kansion .py-tiedostot paitsi __init__
        for filename in os.listdir(package_dir):
            if filename.endswith(".py") and filename != "__init__.py":
                module_name = filename[:-3]
                try:
                    mod = importlib.import_module(f".{module_name}", package="modules.kalevala")
                    # Etsitään moduulista mikä tahansa Manager- tai Core-luokka
                    for attr_name in dir(mod):
                        if "Manager" in attr_name or "Core" in attr_name:
                            cls = getattr(mod, attr_name)
                            if isinstance(cls, type):
                                self.modules.append(cls())
                                break
                except Exception as e:
                    print(f"Varoitus: Moduulin {module_name} lataus epäonnistui: {e}")

    def run_epic_chronicles(self):
        print("==================================================")
        print("   WOOD-BOOSTER OS: KALEVALA SUBSYSTEM EPIC RUN     ")
        print("==================================================")
        for mod in self.modules:
            for method_name in dir(mod):
                if method_name.startswith("run_"):
                    method = getattr(mod, method_name)
                    if callable(method):
                        try:
                            method()
                        except Exception:
                            pass
        print("==================================================")
        print("   KALEVALAN TARU ON SAATETTU PÄÄTÖSEEN.           ")
        print("==================================================")


if __name__ == "__main__":
    subsystem = KalevalaSubsystem()
    subsystem.run_epic_chronicles()
