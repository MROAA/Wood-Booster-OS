#!/usr/bin/env python3
"""
Spacemonkey Interactive CLI Tool - Wood-Booster-OS

Tarjoaa interaktiivisen komentosarjanäytön Spacemonkeybrain-moottorin ohjaamiseen,
tilan tarkasteluun, ärsykkeiden syöttämiseen ja versioiden rollbackeihin.
"""

import sys
import os
import json
from typing import Dict, Any

# Tuodaan Facade ja ConfigLoader
try:
    from spc_facade import SpacemonkeyFacade
    from config_loader import ConfigLoader
except ImportError as e:
    print(f"\033[91m[Virhe] Moduulien lataus epäonnistui: {e}\033[0m")
    sys.exit(1)


# ANSI-värit ilmeikkääseen CLI-tulostukseen
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


class SpacemonkeyCLI:

    def __init__(self):
        print(f"{Colors.HEADER}{Colors.BOLD}==============================================")
        print("   WOOD-BOOSTER-OS // SPACEMONKEYBRAIN CLI   ")
        print(f"=============================================={Colors.ENDC}\n")
        
        # Alustetaan Facade
        self.facade = SpacemonkeyFacade(system_name="SpacemonkeyBrain-CLI")
        
        # Ladataan JSON-konfiguraatiot jos saatavilla
        loader = ConfigLoader()
        custom_identities = loader.load_identities()
        if custom_identities:
            self.facade.layers.update(custom_identities)
            print(f"{Colors.OKCYAN}[CLI] Ladattu {len(custom_identities)} mukautettua kerrosta config-hakemistosta.{Colors.ENDC}\n")

    def print_menu(self):
        print(f"\n{Colors.BOLD}Komennot:{Colors.ENDC}")
        print("  [1] Syötä tekstiä / prompti (Turvatarkastettu)")
        print("  [2] Syötä tunne-ärsyke (threat, reward, novelty, error, calm)")
        print("  [3] Näytä nykytila & Persoonallisuusprofiili")
        print("  [4] Listaa versiohistoria (Snapshotit)")
        print("  [5] Luo uusi Versiosnapshot")
        print("  [6] Tee Rollback aiempaan versioon")
        print("  [7] Suorita aika-vaimennus (Time Decay)")
        print("  [q] Poistu")

    def print_status(self, status: Dict[str, Any]):
        print(f"\n{Colors.OKBLUE}=== SPACEMONKEY SYSTEM STATUS ==={Colors.ENDC}")
        print(f"{Colors.BOLD}Järjestelmä:{Colors.ENDC} {status.get('system_name')}")
        print(f"{Colors.BOLD}Aktiivinen Snapshot:{Colors.ENDC} {status.get('active_snapshot')}")
        
        # Limbic State
        limbic = status.get('limbic_state', {})
        print(f"\n{Colors.OKCYAN}Limbic State:{Colors.ENDC}")
        print(f"  • Valence (mieliala):  {limbic.get('valence')}")
        print(f"  • Arousal (vireys):    {limbic.get('arousal')}")
        print(f"  • Stress (stressi):    {limbic.get('stress')}")
        print(f"  • Curiosity (uteliaisuus): {limbic.get('curiosity')}")

        # Personality Profile
        pers = status.get('personality_profile', {})
        print(f"\n{Colors.OKGREEN}Personality Profile:{Colors.ENDC}")
        print(f"  • Primary Mode:     {Colors.BOLD}{pers.get('primary_mode')}{Colors.ENDC}")
        print(f"  • Tone of Voice:    {pers.get('tone_of_voice')}")
        print(f"  • Creativity Index: {pers.get('creativity_index')}")
        print(f"  • Risk Tolerance:   {pers.get('risk_tolerance')}")
        
        # Security Status
        sec = status.get('security_status', {})
        if sec:
            print(f"\n{Colors.WARNING}Security Status:{Colors.ENDC}")
            print(f"  • Status:             {sec.get('status')}")
            print(f"  • Estetyt hyökkäykset: {sec.get('violations_blocked', 0)}")
        print(f"{Colors.OKBLUE}================================={Colors.ENDC}")

    def run(self):
        while True:
            self.print_menu()
            choice = input(f"\n{Colors.BOLD}Valitse toiminto (1-7 / q): {Colors.ENDC}").strip()

            if choice == "1":
                prompt = input("\nSyötä teksti Spacemonkeylle: ").strip()
                if prompt:
                    res = self.facade.process_text_prompt(prompt)
                    if res["status"] == "ALLOWED":
                        print(f"\n{Colors.OKGREEN}[HYVÄKSYTTY]{Colors.ENDC} Syöte läpäisi SecurityGuardin.")
                        print(f"Sanitoitu prompti: \"{res['prompt']}\"")
                    else:
                        print(f"\n{Colors.FAIL}[BLOKATTU - TURVALLISUUSRIKE]{Colors.ENDC}")
                        print(f"Syy: {res['reason']}")
                    self.print_status(res["system"])

            elif choice == "2":
                print("\nSallitut ärsykkeet: threat, reward, novelty, error, calm")
                st_type = input("Syötä ärsykkeen tyyppi: ").strip()
                try:
                    intensity = float(input("Syötä voimakkuus (0.0 - 1.0): ").strip())
                    status = self.facade.process_input_stimulus(st_type, intensity)
                    print(f"\n{Colors.OKGREEN}Ärsyke käsitelty!{Colors.ENDC}")
                    self.print_status(status)
                except ValueError:
                    print(f"{Colors.FAIL}Virheellinen voimakkuus-arvo.{Colors.ENDC}")

            elif choice == "3":
                self.print_status(self.facade.get_full_status())

            elif choice == "4":
                print(f"\n{Colors.OKBLUE}=== VERSIOHISTORIA ==={Colors.ENDC}")
                history = self.facade.list_history()
                for v in history:
                    active_tag = f" {Colors.OKGREEN}(AKTIIVINEN){Colors.ENDC}" if v["is_active"] else ""
                    print(f" • [{v['snapshot_id']}] Label: {v['version_label']} - {v['description']}{active_tag}")

            elif choice == "5":
                label = input("\nSyötä versiotag (esim. 1.1.0-custom): ").strip()
                desc = input("Syötä kuvaus: ").strip()
                if label:
                    snap = self.facade.save_snapshot(label, desc)
                    print(f"\n{Colors.OKGREEN}Snapshot luotu ID:llä: {snap.snapshot_id}{Colors.ENDC}")

            elif choice == "6":
                snap_id = input("\nSyötä Snapshot ID johon haluat palata: ").strip()
                if snap_id:
                    success = self.facade.rollback_to_snapshot(snap_id)
                    if success:
                        print(f"\n{Colors.OKGREEN}Rollback suoritettu versioon {snap_id}!{Colors.ENDC}")
                        self.print_status(self.facade.get_full_status())
                    else:
                        print(f"\n{Colors.FAIL}Rollback epäonnistui.{Colors.ENDC}")

            elif choice == "7":
                self.facade.tick_time_decay()
                print(f"\n{Colors.OKCYAN}Aika-vaimennus suoritettu (Tunnetila palautuu kohti neutraalia).{Colors.ENDC}")
                self.print_status(self.facade.get_full_status())

            elif choice.lower() in ("q", "exit", "quit"):
                print(f"\n{Colors.HEADER}Sammutetaan Spacemonkey CLI. Näkemiin!{Colors.ENDC}\n")
                break
            else:
                print(f"\n{Colors.FAIL}Tuntematon valinta, kokeile uudelleen.{Colors.ENDC}")


if __name__ == "__main__":
    cli = SpacemonkeyCLI()
    cli.run()
