#!/usr/bin/env python3
import subprocess
import sys
import os

# Ohjataan moduulipolku src-hakemistoon
sys.path.insert(0, os.path.abspath("./src"))

try:
    from spacemonkey.version_manager import IdentityVersionManager, IdentityLayer
    from spacemonkey.limbic_system import LimbicSystem
except ImportError as e:
    sys.exit(0)


def get_git_commit_info():
    try:
        commit_hash = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True).strip()
        commit_msg = subprocess.check_output(["git", "log", "-1", "--pretty=%B"], text=True).strip()
        return commit_hash, commit_msg
    except Exception:
        return "unknown", "Automated commit snapshot"


def create_post_commit_snapshot():
    commit_hash, commit_msg = get_git_commit_info()
    vm = IdentityVersionManager(storage_dir="./versions")
    limbic = LimbicSystem()

    layers = {
        "core": IdentityLayer(
            layer_name="CoreIdentity",
            version="1.0.0",
            attributes={"base_model": "Spacemonkeybrain", "git_commit": commit_hash}
        ),
        "limbic": IdentityLayer(
            layer_name="LimbicState",
            version="0.1.0",
            attributes=limbic.to_dict()
        )
    }

    vm.create_snapshot(
        version_label=f"git-{commit_hash}",
        layers=layers,
        description=f"Auto-snapshot: {commit_msg}"
    )


if __name__ == "__main__":
    create_post_commit_snapshot()
