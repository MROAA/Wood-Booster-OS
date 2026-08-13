#!/usr/bin/env python3
"""
Wood-Booster OS - Kalevala Subsystem Master Index
Kokoaa kaikki tarut ja moduulit yhteen yhtenäiseksi eeppiseksi järjestelmäkirjastoksi.
"""

from .vainamoinen_startup import VäinämöinenManager
from .ilmarinen_forge import IlmarinenManager
from .leminkainen_turtles import LemminkäinenManager
from .joukahainen_bog import JoukahainenManager
from .aino_escape import AinoManager
from .pohjola_wedding import WeddingManager
from .sampo_forging import SampoManager
from .sampo_theft import TheftManager
from .sampo_fragments import FragmentsManager
from .louhi_spells import LouhiManager
from .kultaneito_factory import KultaneitoManager
from .tuonela_swan import SwanManager
from .hiiden_elk import ElkManager
from .antero_vipunen import VipunenManager
from .imatra_rapids import RapidsManager
from .talking_pike import PikeManager
from .marjatta_child import MarjattaManager
from .väinämöisen_lähtö import DepartureManager


class KalevalaSubsystem:
    """Yhdistää koko Kalevala-eepoksen yhdeksi hallittavaksi Wood-Booster OS -alijärjestelmäksi."""
    def __init__(self):
        self.modules = [
            VäinämöinenManager(),
            IlmarinenManager(),
            LemminkäinenManager(),
            JoukahainenManager(),
            AinoManager(),
            WeddingManager(),
            SampoManager(),
            TheftManager(),
            FragmentsManager(),
            LouhiManager(),
            KultaneitoManager(),
            SwanManager(),
            ElkManager(),
            VipunenManager(),
            RapidsManager(),
            PikeManager(),
            MarjattaManager(),
            DepartureManager()
        ]

    def run_epic_chronicles(self):
        print("==================================================")
        print("   WOOD-BOOSTER OS: KALEVALA SUBSYSTEM EPIC RUN     ")
        print("==================================================")
        for mod in self.modules:
            for method_name in [
                'run_startup_routine', 'run_forging_sequence', 'run_adventure',
                'run_challenge', 'run_emergency_release', 'run_wedding_feast',
                'run_sampo_cycle', 'run_backup_heist', 'run_restoration_routine',
                'run_security_protocol', 'run_assistant_sequence', 'run_surveillance',
                'run_speed_test', 'run_deep_query', 'run_load_test',
                'run_oracle_session', 'run_upgrade_routine', 'run_shutdown_sequence'
            ]:
                if hasattr(mod, method_name):
                    getattr(mod, method_name)()
        print("==================================================")
        print("   KALEVALAN TARU ON SAATETTU PÄÄTÖSEEN.           ")
        print("==================================================")


if __name__ == "__main__":
    subsystem = KalevalaSubsystem()
    subsystem.run_epic_chronicles()
