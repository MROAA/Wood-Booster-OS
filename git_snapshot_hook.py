#!/usr/bin/env python3
"""
Git Guardian Integration Hook - Wood-Booster-OS / Spacemonkeybrain

Tämä skripti suoritetaan automaattisesti Git-commitin jälkeen (tai Git Guardian
-tarkistuksen yhteydessä). Se kaappaa Spacemonkeyn nykyisen tilan ja tallentaa 
siitä uuden IdentitySnapshotin kytkettynä uusimpaan Git-commitiin.
"""

import subprocess
import sys
import os

# Tuodaan aiemmin luodut moduulit
try:
    from version_manager import IdentityVersionManager, IdentityLayer
    from limbic_system import LimbicSystem
except ImportError as e:
    print(f"[GitHook Warning] Moduulien lataus epäonnistui: {e}")
    sys.exit(0)  # Estetään Git-commitin kaatuminen pienen varoituksen takia


def get_git_commit_info():
    """Hakee uusimman Git-commitin tiivisteen ja viestin."""
    try:
        commit_hash = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], 
            text=True
        ).strip()
        commit_msg = subprocess.check_output(
            ["git", "log", "-1", "--pretty=%B"], 
            text=True
        ).strip()
        return commit_hash, commit_msg
    except Exception as e:
        print(f"[GitHook] Ei voitu hakea Git-tietoja: {e}")
        return "unknown", "Automated commit snapshot"


def create_post_commit_snapshot():
    """Luo ja tallentaa IdentitySnapshotin Git-commitin jälkeen."""
    commit_hash, commit_msg = get_git_commit_info()
    
    print(f"\n[Git Guardian Hook] Luodaan automaattinen snapshot commitille: {commit_hash}")

    # Alustetaan versiohallinta
    vm = IdentityVersionManager(storage_dir="./versions")

    # Alustetaan/ladataan nykyinen limbinen tila (esimerkkitila)
    limbic = LimbicSystem()
    current_limbic_state = limbic.get_state()

    # Määritetään kerrokset
    core_layer = IdentityLayer(
        layer_name="CoreIdentity",
        version="1.0.0",
        attributes={
            "base_model": "Spacemonkeybrain",
            "git_commit": commit_hash,
            "security_status": "VERIFIED_BY_GIT_GUARDIAN"
        }
    )

    limbic_layer = IdentityLayer(
        layer_name="LimbicState",
        version="0.1.0",
        attributes=limbic.to_dict()
    )

    layers = {
        "core": core_layer,
        "limbic": limbic_layer
    }

    # Luodaan snapshot kytkettynä commit-tietoihin
    version_label = f"git-{commit_hash}"
    description = f"Auto-snapshot via Git/GitGuardian: {commit_msg}"

    snapshot = vm.create_snapshot(
        version_label=version_label,
        layers=layers,
        description=description
    )

    print(f"[Git Guardian Hook] Snapshot tallennettu onnistuneesti -> ID: {snapshot.snapshot_id}")


if __name__ == "__main__":
    create_post_commit_snapshot()
