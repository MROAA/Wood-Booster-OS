import re
from typing import Any, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from backend.modules.spacemonkey_core import run_spacemonkey
from backend.modules.spacemonkey_alter_ego import process_altrako, AltrakoRequest

router = APIRouter()

MODE_PATTERN = re.compile(r"^/(spacemonkey|altrako|council)\b\s*", re.IGNORECASE)

DEFAULT_TEXT_BY_MODE = {
    "spacemonkey": "Tilannekatsaus.",
    "council": "Tilannekatsaus.",
    "altrako": "tila",
}


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    mode: str
    reply: str
    spacemonkey: Optional[Dict[str, Any]] = None
    altrako: Optional[Dict[str, Any]] = None


def detect_mode(message: str):
    """Tunnistaa /spacemonkey, /altrako, /council -etuliitteen viestin alusta.
    Oletustila (ei etuliitettä) on spacemonkey - PRD osio 6, 'Normaali käyttö'."""
    match = MODE_PATTERN.match(message.strip())
    if not match:
        return "spacemonkey", message.strip()

    mode = match.group(1).lower()
    remainder = message[match.end():].strip()
    return mode, remainder


@router.post("/process", response_model=ChatResponse)
def process_chat(payload: ChatRequest):
    """Yhtenäinen chat-sisäänkäynti kaikille tiloille (PRD osio 6, Chat-tilat).
    Council-tilassa Spacemonkey ehdottaa ja Altrako arvioi, ja molemmat
    vastaukset yhdistetään yhdeksi näkyväksi vastaukseksi."""
    mode, text = detect_mode(payload.message)
    if not text:
        text = DEFAULT_TEXT_BY_MODE[mode]

    if mode == "altrako":
        altrako_result = process_altrako(AltrakoRequest(command=text))
        return ChatResponse(
            mode="altrako",
            reply=altrako_result.reply,
            altrako=altrako_result.model_dump(),
        )

    if mode == "council":
        sm_result = run_spacemonkey(text)
        altrako_result = process_altrako(AltrakoRequest(command=text))
        joint_reply = (
            f"🧠 Spacemonkey ehdottaa:\n{sm_result['reply']}\n\n"
            f"🐵 Altrako arvioi:\n{altrako_result.reply}"
        )
        return ChatResponse(
            mode="council",
            reply=joint_reply,
            spacemonkey=sm_result,
            altrako=altrako_result.model_dump(),
        )

    # Oletustila: spacemonkey
    sm_result = run_spacemonkey(text)
    return ChatResponse(mode="spacemonkey", reply=sm_result["reply"], spacemonkey=sm_result)
