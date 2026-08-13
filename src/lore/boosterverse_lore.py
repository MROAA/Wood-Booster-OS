#!/usr/bin/env python3
"""
Wood-Booster OS - Boosterverse Lore & Mythology Registry
Määrittelee Kalevala-mytologian ja ytimen komponenttien välisen metatieto- ja tarinasuhteen.
"""

from rich.console import Console
from rich.panel import Panel

console = Console()

BOOSTERVERSE_LORE = {
    "world": "Boosterverse",
    "os": "Wood-Booster OS",
    "mythology_mapping": {
        "Sampo": {
            "role": "System Core & Infinite Resource Generator",
            "description": "Tuottaa rajattomasti datapaketteja, resursseja ja vakautta järjestelmän ytimeen."
        },
        "Väinämöinen": {
            "role": "Kernel Wisdom & Error Eraser",
            "description": "Laulaa muistivuodot ja segmenttivirheet syvälle suohoon; ikuinen versionhallinnan vartija."
        },
        "Ilmarinen": {
            "role": "Master Builder & Compiler",
            "description": "Takoo taivaankantta ja kääntää C++ / Python -lähdekoodit rautaisiksi binääreiksi."
        },
        "Louhi": {
            "role": "Security Firewall & Pohjola Guardian",
            "description": "Lukitsee luvattomat portit Pohjolan pakkasilla ja valvoo järjestelmän rajapintoja."
        },
        "Spacemonkey": {
            "role": "Operator & AI Desktop Builder",
            "description": "Kiertää Boosterversessa, lukee specsejä ja rakentaa työpöytänäkymiä koodaamalla."
        }
    }
}

def display_lore():
    console.print(Panel("[bold yellow]BOOSTERVERSE: KALEVALA LORE REGISTRY[/bold yellow]\n"
                        "Tieto- ja identiteettikerros Wood-Booster OS -järjestelmälle.", border_style="yellow"))
    
    for entity, data in BOOSTERVERSE_LORE["mythology_mapping"].items():
        console.print(f"[bold cyan]• {entity}[/bold cyan] ([italic]{data['role']}[/italic])")
        console.print(f"  {data['description']}\n")

if __name__ == "__main__":
    display_lore()
