import os
import sys
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from backend.modules.paths import SOURCE_ROOT, PY_DATA_DIR

router = APIRouter()

# Sama periaate kuin git_guardian.py:ssä: käytetään oikeaa, olemassa olevaa
# Spacemonkey-ydintä (src/spacemonkey/) sen sijaan että rakennettaisiin
# rinnakkainen, valeteksti Python Core -toteutus tähän moduuliin.
_SRC_PATH = os.path.join(SOURCE_ROOT, "src")
if _SRC_PATH not in sys.path:
    sys.path.insert(0, _SRC_PATH)

from spacemonkey.spc_facade import SpacemonkeyFacade

# Yksi pysyvä Facade-instanssi koko palvelimen elinkaaren ajaksi, jotta
# tunnetila (limbic state) ja persoonallisuus kehittyvät oikeasti viestien
# välillä sen sijaan että nollautuisivat joka pyynnöllä. versions/ ja
# audit.log ovat ajonaikaista tilaa, ei lähdekoodia - PY_DATA_DIR:in alla
# samaan tapaan kuin git_guardian_history.json, ei repositoryn juuressa.
_facade = SpacemonkeyFacade(
    system_name="SpacemonkeyHQ",
    storage_dir=os.path.join(PY_DATA_DIR, "versions"),
    log_file=os.path.join(PY_DATA_DIR, "audit.log"),
)


class CommandRequest(BaseModel):
    command: str
    context: Optional[dict] = None


class CommandResponse(BaseModel):
    status: str
    reply: str
    system: dict


def build_reply(result: dict) -> str:
    if result["status"] == "BLOCKED":
        return f"🛑 Estetty: {result['reason']}"

    profile = result["system"]["personality_profile"]
    return f"[{profile['primary_mode']}] {profile['tone_of_voice']}"


def run_spacemonkey(command: str) -> dict:
    """Jaettu polku ytimen läpi - käytetään sekä /process-reitiltä että
    spacemonkey_chat.py:n oikeasta keskustelusta, jotta molemmat jakavat
    saman tunnetilan sen sijaan että sillä olisi kaksi erillistä instanssia."""
    result = _facade.process_text_prompt(command.strip())
    return {
        "status": result["status"],
        "reply": build_reply(result),
        "system": result["system"],
    }


@router.post("/process", response_model=CommandResponse)
def process_spacemonkey_command(payload: CommandRequest):
    """Vie käyttäjän viestin oikean Spacemonkey-ytimen läpi (turvatarkistus,
    tunnetila, persoonallisuus) ja palauttaa sen todellisen reaktion."""
    return CommandResponse(**run_spacemonkey(payload.command))
