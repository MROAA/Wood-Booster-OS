#!/usr/bin/env python3
from rich.live import Live
from rich.table import Table
from rich.panel import Panel
from rich.console import Console
import time
import random

console = Console()

def generate_table() -> Table:
    """Luo dynaamisen tilannetaulun järjestelmän moduuleista."""
    table = Table(title="Wood-Booster OS: Kalevala Subsystem Status")
    table.add_column("Moduuli", style="cyan")
    table.add_column("Tila", style="green")
    table.add_column("Resurssit", justify="right", style="magenta")

    modules = ["Väinämöinen", "Ilmarinen", "Lemminkäinen", "Joukahainen", "Sampo"]
    for mod in modules:
        table.add_row(mod, "Aktiivinen", f"{random.randint(10, 100)} MB")
    
    return table

if __name__ == "__main__":
    console.print(Panel("[bold yellow]Käynnistetään Kalevala Dashboard...[/bold yellow]"))
    with Live(generate_table(), refresh_per_second=1) as live:
        for _ in range(20):
            time.sleep(1)
            live.update(generate_table())
