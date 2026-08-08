#!/usr/bin/env python3
"""
Spacemonkey Status Bridge - Wood-Booster-OS

Tulostaa Python-Spacemonkeyn koko tilan JSON-muodossa stdoutiin, jotta
Node.js-taustajärjestelmä (System Pulse) voi lukea sen. Ei tulosta
mitään muuta stdoutiin - vain yksi JSON-rivi, jotta Node-puolen
jäsennys pysyy yksinkertaisena ja luotettavana.
"""

import sys
import os
import json

sys.path.insert(0, os.path.abspath("./src"))

from spacemonkey.spc_facade import SpacemonkeyFacade


def main() -> int:
    try:
        facade = SpacemonkeyFacade(system_name="SpacemonkeySystemPulseBridge")
        status = facade.get_full_status()
        print(json.dumps(status))
        return 0
    except Exception as error:
        print(json.dumps({"error": str(error)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
