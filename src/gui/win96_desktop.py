#!/usr/bin/env python3
"""
Wood-Booster OS - Win96 Desktop Environment
Tarjoaa retrotyylisen Win96-käyttöliittymän Kalevala-moduulien ja ytimen hallintaan.
"""

from rich.console import Console
from rich.panel import Panel
from rich.layout import Layout
from rich.table import Table
from rich.prompt import Prompt
import sys
import os

# Lisätään polku moduuleille
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from modules.kalevala import KalevalaSubsystem
from utils.logger import get_logger

log = get_logger("Win96GUI")
console = Console()

class Win96Desktop:
    """Wood-Booster OS Win96 Työpöytäsovellus."""
    def __init__(self):
        self.kalevala = KalevalaSubsystem()
        self.running = True

    def make_header(self) -> Panel:
        return Panel(
            "[bold white]WOOD-BOOSTER OS v2.0[/bold white] | [cyan]Win96 Desktop Environment[/cyan] | [yellow]Kalevala Edition[/yellow]",
            style="blue on blue"
        )

    def make_menu(self) -> Table:
        table = Table(show_header=False, box=None)
        table.add_column("Command", style="bold green")
        table.add_column("Action", style="white")
        table.add_row("[1]", "Aja Kalevala Epic Run (Kaikki tarut)")
        table.add_row("[2]", "Avaa järjestelmän lokit (Loguru)")
        table.add_row("[3]", "Järjestelmän tilatiedot (psutil)")
        table.add_row("[4]", "Käynnistä Win96 tiedostonhallinta")
        table.add_row("[0]", "Sulje käyttöjärjestelmä")
        return table

    def run(self):
        log.info("Win96 työpöytä käynnistetty.")
        while self.running:
            console.clear()
            console.print(self.make_header())
            console.print(Panel(self.make_menu(), title="Päävalikko", border_style="cyan"))
            
            choice = Prompt.ask("\nValitse toiminto", choices=["1", "2", "3", "4", "0"], default="1")
            
            if choice == "1":
                console.clear()
                console.print(Panel("[bold green]Suoritetaan Kalevala-tarusykli...[/bold green]"))
                self.kalevala.run_epic_chronicles()
                Prompt.ask("\nPaina Enter palataksesi työpöydälle...")
            elif choice == "2":
                console.clear()
                console.print(Panel("[bold yellow]Viimeisimmät järjestelmälokit (logs/wood_booster.log):[/bold yellow]"))
                if os.path.exists("logs/wood_booster.log"):
                    with open("logs/wood_booster.log", "r") as f:
                        lines = f.readlines()
                        for line in lines[-15:]:
                            console.print(line.strip())
                else:
                    console.print("[red]Ei lokitiedostoja löytynyt vielä.[/red]")
                Prompt.ask("\nPaina Enter palataksesi työpöydälle...")
            elif choice == "3":
                console.clear()
                import psutil
                console.print(Panel(f"[bold cyan]Järjestelmän resurssit:[/bold cyan]\n"
                                    f"CPU-käyttö: {psutil.cpu_percent()}%\n"
                                    f"Muistin käyttö: {psutil.virtual_memory().percent}%\n"
                                    f"Levytila: {psutil.disk_usage('/').percent}%", title="System Monitor"))
                Prompt.ask("\nPaina Enter palataksesi työpöydälle...")
            elif choice == "4":
                console.clear()
                console.print(Panel("[magenta]Win96 File Manager: C:\\WOOD_OS\\MODULES\\KALEVALA[/magenta]"))
                files = os.listdir("src/modules/kalevala")
                for f in files:
                    console.print(f" - {f}")
                Prompt.ask("\nPaina Enter palataksesi työpöydälle...")
            elif choice == "0":
                console.print("[red]Sammutetaan Wood-Booster OS... Heippa![/red]")
                log.info("Win96 työpöytä sammutettu käyttäjän toimesta.")
                self.running = False

if __name__ == "__main__":
    desktop = Win96Desktop()
    desktop.run()
