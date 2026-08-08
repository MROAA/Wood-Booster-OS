import os
import subprocess
import shutil
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional

router = APIRouter()

class SystemStatusResponse(BaseModel):
    system_status: str
    git_info: Dict[str, Any]
    disk_usage: Dict[str, Any]
    engine_version: str = "Wood Booster OS 1.0"

def get_git_info() -> Dict[str, Any]:
    """Lukee projektin Git-versionhallinnan tilan suoraan järjestelmästä."""
    try:
        branch = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"], 
            stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()

        commit = subprocess.check_output(
            ["git", "log", "-1", "--format=%h - %s"], 
            stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()

        status = subprocess.check_output(
            ["git", "status", "--porcelain"], 
            stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()

        has_changes = len(status) > 0

        return {
            "branch": branch,
            "last_commit": commit,
            "uncommitted_changes": has_changes,
            "status": "connected"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Git-tietoja ei voitu lukea: {str(e)}"
        }

def get_disk_health() -> Dict[str, Any]:
    """Laskee levytilan käytön projektikansiossa."""
    total, used, free = shutil.disk_usage("/")
    return {
        "total_gb": round(total / (1024**3), 2),
        "used_gb": round(used / (1024**3), 2),
        "free_gb": round(free / (1024**3), 2),
        "used_percentage": round((used / total) * 100, 1)
    }

@router.get("/status", response_model=SystemStatusResponse)
def get_system_pulse():
    """Palauttaa järjestelmän tilan, versionhallinnan ja levytilan."""
    git_data = get_git_info()
    disk_data = get_disk_health()

    return SystemStatusResponse(
        system_status="healthy",
        git_info=git_data,
        disk_usage=disk_data
    )
