"""Pysyvät, koneelle tallennetut asetukset joita ei paketoida asennukseen.

Tällä hetkellä vain Anthropic API -avain: Spacemonkey-chat tarvitsee sen
toimiakseen, mutta sitä ei koskaan pakata Tauri-asennuspakettiin (ks.
spacemonkey_chat.py). Marc syöttää sen kerran asetusnäkymän kautta tämän
jälkeen, ja se tallentuu PY_DATA_DIR:iin - säilyy sovelluspäivitysten yli,
ei asennuspaketin mukana.
"""

import json
import os
import stat

from fastapi import APIRouter
from pydantic import BaseModel

from backend.modules.paths import PY_DATA_DIR

router = APIRouter()

SECRETS_FILE = os.path.join(PY_DATA_DIR, "secrets.json")


class ApiKeyRequest(BaseModel):
    api_key: str


def load_anthropic_key() -> str:
    """Palauttaa tallennetun avaimen, tai tyhjän merkkijonon jos sitä ei ole."""
    if not os.path.exists(SECRETS_FILE):
        return ""
    try:
        with open(SECRETS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return (data.get("anthropic_api_key") or "").strip()
    except (json.JSONDecodeError, OSError):
        return ""


def save_anthropic_key(api_key: str) -> None:
    os.makedirs(PY_DATA_DIR, exist_ok=True)
    with open(SECRETS_FILE, "w", encoding="utf-8") as f:
        json.dump({"anthropic_api_key": api_key.strip()}, f)
    # Vain omistaja saa lukea - tässä on oikea API-avain.
    os.chmod(SECRETS_FILE, stat.S_IRUSR | stat.S_IWUSR)


@router.get("/anthropic-key")
def get_anthropic_key_status():
    """Ei koskaan palauta itse avainta takaisin - vain onko sellainen asetettu."""
    configured = bool(load_anthropic_key()) or bool(
        os.getenv("ANTHROPIC_API_KEY", "").strip()
    )
    return {"configured": configured}


@router.post("/anthropic-key")
def set_anthropic_key(payload: ApiKeyRequest):
    key = payload.api_key.strip()
    if not key:
        return {"status": "error", "message": "API-avain ei voi olla tyhjä."}

    save_anthropic_key(key)

    from backend.modules import spacemonkey_chat
    spacemonkey_chat.reload_client()

    return {"status": "success"}
