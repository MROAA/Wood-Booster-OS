#!/usr/bin/env python3
"""
Spacemonkey Interactive CLI - Wood-Booster-OS
Interaktiivinen testaustyökalu Spacemonkey-moottorille.
"""

import sys
import os

# Lisätään src moduulipolkuun
sys.path.insert(0, os.path.abspath("./src"))

from spacemonkey.spc_facade import SpacemonkeyFacade


def print_status(status: dict):
    print("\n" + "=" * 40)
    print(f" JÄRJESTELMÄ: {status['system_name']}")
    print(f" Tila / Mode:  {status['personality_profile']['primary_mode']}")
    print(f" Äänensävy:   {status['personality_profile']['tone_of_voice']}")
    print(f" Turvatila:   {status['security_status']['status']} (Estetty: {status['security_status']['violations_blocked']})")
    limbic = status['limbic_state']
    print(f" Tunnetila:   Stressi: {limbic['stress']:.2f} | Uteliaisuus: {limbic['curiosity']:.2f} | Valenssi: {limbic['valence']:.2f}")
    print("=" * 40 + "\n")


def main():
    facade = SpacemonkeyFacade(system_name="SpacemonkeyCLI")
    print("\n--- Spacemonkey Interactive CLI Käynnistetty ---")
    print("Komennot:")
    print("  /status                 - Näytä nykyinen tila")
    print("  /stimulus <tyyppi> <arvo> - Anna tunne-ärsyke (esim. /stimulus threat 0.8)")
    print("  /exit                   - Poistu\n")

    print_status(facade.get_full_status())

    while True:
        try:
            user_input = input("Spacemonkey> ").strip()
            if not user_input:
                continue

            if user_input == "/exit":
                print("Suljetaan CLI. Näkemiin!")
                break
            elif user_input == "/status":
                print_status(facade.get_full_status())
            elif user_input.startswith("/stimulus"):
                parts = user_input.split()
                if len(parts) == 3:
                    st_type = parts[1]
                    try:
                        intensity = float(parts[2])
                        res = facade.process_input_stimulus(st_type, intensity)
                        print(f"[+] Ärsyke prosessoitu: {st_type} = {intensity}")
                        print_status(res)
                    except ValueError:
                        print("[!] Virhe: Ärsykkeen voimakkuuden pitää olla numero (0.0 - 1.0).")
                else:
                    print("[!] Käyttö: /stimulus <tyyppi> <arvo>")
            else:
                res = facade.process_text_prompt(user_input)
                if res["status"] == "ALLOWED":
                    print(f"\n[SALLITTU] Vastaanotettu: '{res['prompt']}'")
                else:
                    print(f"\n[ESTETTY] Syy: {res['reason']}")
                print_status(res["system"])

        except (KeyboardInterrupt, EOFError):
            print("\nSuljetaan CLI.")
            break


if __name__ == "__main__":
    main()
