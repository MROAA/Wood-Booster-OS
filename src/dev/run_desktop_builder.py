#!/usr/bin/env python3
"""
Wood-Booster OS - Desktop Builder End-to-End Integrator
Kokoaa Spacemonkey Desktop Builderin, validointiputken ja runtime-ajon yhteen.
"""

import sys
import os

# Lisätään hakemisto polkuun
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dev.desktop_builder import DesktopBuilderEngine
from utils.logger import get_logger

log = get_logger("DesktopBuilderE2E")

def main():
    print("==================================================")
    print("   SPACEMONKEY PYTHON DESKTOP BUILDER (E2E)       ")
    print("==================================================")
    
    log.info("Käynnistetään Desktop Builder -putki...")
    
    # 1. Alustetaan moottori
    builder = DesktopBuilderEngine()
    
    # 2. Luodaan spesifikaatio
    print("\n[Vaihe 1/4] Luodaan Desktop Specification...")
    spec = builder.create_specification("Wood-Booster Ultimate Dev Desktop")
    
    # 3. Generoidaan Python-koodi
    print("\n[Vaihe 2/4] Generoidaan Python-työpöytäkoodi...")
    builder.generate_python_code()
    
    # 4. Validoidaan ja buildataan
    print("\n[Vaihe 3/4] Suoritetaan Build ja Staattinen Analyysi...")
    if builder.validate_and_build():
        print("[SUCCESS] Build läpäisty puhtaasti!")
        
        # 5. Ajetaan Preview / Runtime
        print("\n[Vaihe 4/4] Käynnistetään Sandbox Desktop Preview...")
        print("--------------------------------------------------")
        builder.run_preview()
        print("--------------------------------------------------")
        print("[OK] End-to-end-sykli suoritettu onnistuneesti!")
    else:
        print("[ERROR] Build epäonnistui. Itsekorjaus vaaditaan.")
        sys.exit(1)

    print("==================================================")

if __name__ == "__main__":
    main()
