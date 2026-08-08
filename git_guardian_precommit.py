#!/usr/bin/env python3
"""
Git Guardian pre-commit hook entrypoint.

Skannaa commitiin menossa olevat tiedostot ja estää commitin, jos
löytyy tunnettu salaisuus tai kielletty tiedostomuoto. Ei koskaan
suorita mielivaltaisia komentoja - vain kiinteä, tunnettu skannaus.
"""

import sys
import os

sys.path.insert(0, os.path.abspath("./src"))

from spacemonkey.git_guardian import scan_staged_changes


def main() -> int:
    report = scan_staged_changes()

    if report.safe:
        return 0

    print("\n🛑 Git Guardian ESTI commitin: turvallisuusriski havaittu!\n")
    for risk in report.risks:
        print(f"  [{risk.risk_type}] {risk.file}")
        print(f"    -> {risk.reason}")

    print(
        "\nJos tämä on väärä hälytys, tarkista tiedosto käsin. "
        "Älä ohita tätä tarkistusta (--no-verify) ilman että olet varma "
        "ettei tiedosto sisällä oikeita salaisuuksia.\n"
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
