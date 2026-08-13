#!/usr/bin/env python3
"""
Wood-Booster OS - Kalevala Main Runner
Käynnistää koko Kalevala-alijärjestelmän ja ajaa eeppisen tarusyklin läpi.
"""

from modules.kalevala import KalevalaSubsystem

def main():
    print("Käynnistetään Wood-Booster OS Kalevala-moottori...")
    epic = KalevalaSubsystem()
    epic.run_epic_chronicles()
    print("Kaikki Kalevala-moduulit ajettu onnistuneesti!")

if __name__ == "__main__":
    main()
