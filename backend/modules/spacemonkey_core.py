import os
import sys
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, Optional

router = APIRouter()

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

# Sama periaate kuin git_guardian.py:ssä: käytetään oikeaa, olemassa olevaa
# Spacemonkey-ydintä (src/spacemonkey/) sen sijaan että rakennettaisiin
# rinnakkainen, valeteksti Python Core -toteutus tähän moduuliin.
_SRC_PATH = os.path.join(PROJECT_ROOT, "src")
if _SRC_PATH not in sys.path:
    sys.path.insert(0, _SRC_PATH)

from spacemonkey.spc_facade import SpacemonkeyFacade

# Yksi pysyvä Facade-instanssi koko palvelimen elinkaaren ajaksi, jotta
# tunnetila (limbic state) ja persoonallisuus kehittyvät oikeasti viestien
# välillä sen sijaan että nollautuisivat joka pyynnöllä.
_facade = SpacemonkeyFacade(
    system_name="SpacemonkeyHQ",
    storage_dir=os.path.join(PROJECT_ROOT, "versions"),
    log_file=os.path.join(PROJECT_ROOT, "audit.log"),
)


class CommandRequest(BaseModel):
    command: str
    context: Optional[dict] = None


class CommandResponse(BaseModel):
    status: str
    reply: str
    system: dict
    inner_voice: Optional[Dict[str, Any]] = None


def build_reply(result: dict) -> str:
    if result["status"] == "BLOCKED":
        return f"🛑 Estetty: {result['reason']}"

    profile = result["system"]["personality_profile"]
    return f"[{profile['primary_mode']}] {profile['tone_of_voice']}"


def run_spacemonkey(text: str) -> dict:
    """Jaettu ydinlogiikka - kutsutaan sekä suoraan /process-reitiltä että
    yhtenäisestä chat-tilareitittimestä (backend/modules/chat.py), jotta
    Facade-instanssi ja logiikka pysyvät yhdessä paikassa."""
    result = _facade.process_text_prompt(text.strip())
    return {
        "status": result["status"],
        "reply": build_reply(result),
        "system": result["system"],
        "inner_voice": result.get("inner_voice"),
    }


@router.post("/process", response_model=CommandResponse)
def process_spacemonkey_command(payload: CommandRequest):
    """Vie käyttäjän viestin oikean Spacemonkey-ytimen läpi (turvatarkistus,
    tunnetila, persoonallisuus) ja palauttaa sen todellisen reaktion."""
    result = run_spacemonkey(payload.command)
    return CommandResponse(
        status=result["status"],
        reply=result["reply"],
        system=result["system"],
        inner_voice=result["inner_voice"],
    )
