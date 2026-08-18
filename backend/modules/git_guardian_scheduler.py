import asyncio
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from backend.modules.git_guardian import create_backup
from backend.modules.paths import PY_DATA_DIR

router = APIRouter()

SETTINGS_FILE = os.path.join(PY_DATA_DIR, "git_guardian_settings.json")

DEFAULT_INTERVAL_MINUTES = 15
MIN_INTERVAL_MINUTES = 1
TICK_SECONDS = 30

_state: Dict[str, Any] = {
    "enabled": True,
    "interval_minutes": DEFAULT_INTERVAL_MINUTES,
    "last_run_at": None,
    "last_run_result": None,
}
_seconds_since_last_run = 0
_force_next_tick = False


class AutonomousSettingsRequest(BaseModel):
    enabled: Optional[bool] = None
    interval_minutes: Optional[int] = None


def _load_settings() -> Dict[str, Any]:
    if not os.path.exists(SETTINGS_FILE):
        return {"enabled": True, "interval_minutes": DEFAULT_INTERVAL_MINUTES}
    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {
            "enabled": bool(data.get("enabled", True)),
            "interval_minutes": max(
                MIN_INTERVAL_MINUTES, int(data.get("interval_minutes", DEFAULT_INTERVAL_MINUTES))
            ),
        }
    except (json.JSONDecodeError, OSError, ValueError, TypeError):
        return {"enabled": True, "interval_minutes": DEFAULT_INTERVAL_MINUTES}


def _save_settings():
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {"enabled": _state["enabled"], "interval_minutes": _state["interval_minutes"]},
            f,
            indent=2,
        )


def _public_state() -> Dict[str, Any]:
    return {
        "enabled": _state["enabled"],
        "interval_minutes": _state["interval_minutes"],
        "last_run_at": _state["last_run_at"],
        "last_run_result": _state["last_run_result"],
    }


async def autonomous_loop():
    """Turvatarkistettu automaattinen varmuuskopiointi (PRD osio 9, Autonomous Mode).
    Kutsuu samaa create_backup()-funktiota jota "Backup Now" -nappi kutsuu manuaalisesti -
    silmukka ei koskaan itse tee git-komentoja eikä koskaan kutsu restorea."""
    global _seconds_since_last_run, _force_next_tick

    settings = _load_settings()
    _state["enabled"] = settings["enabled"]
    _state["interval_minutes"] = settings["interval_minutes"]

    while True:
        await asyncio.sleep(TICK_SECONDS)

        if not _state["enabled"]:
            _seconds_since_last_run = 0
            continue

        _seconds_since_last_run += TICK_SECONDS
        due = _seconds_since_last_run >= _state["interval_minutes"] * 60
        if not due and not _force_next_tick:
            continue

        _seconds_since_last_run = 0
        _force_next_tick = False

        try:
            result = create_backup()
        except Exception as error:
            result = {"success": False, "message": str(error)}

        _state["last_run_at"] = datetime.now(timezone.utc).isoformat()
        _state["last_run_result"] = result


def start_autonomous_loop():
    asyncio.create_task(autonomous_loop())


@router.get("/autonomous")
def get_autonomous_status():
    return _public_state()


@router.post("/autonomous/settings")
def update_autonomous_settings(payload: AutonomousSettingsRequest):
    global _force_next_tick

    if payload.enabled is not None:
        turning_on = payload.enabled and not _state["enabled"]
        _state["enabled"] = payload.enabled
        if turning_on:
            _force_next_tick = True

    if payload.interval_minutes is not None:
        _state["interval_minutes"] = max(MIN_INTERVAL_MINUTES, payload.interval_minutes)

    _save_settings()
    return _public_state()
