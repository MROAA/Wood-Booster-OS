import os
import re
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
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

# Keskusteluhistoria - PRD osio 6, "keskustelumuistina". Tallennetaan JSON-
# tiedostoon (sama kevyt kuvio kuin Git Guardianilla), jotta historia säilyy
# yli sivunpäivitysten/uudelleenkäynnistysten sen sijaan että se katoaisi
# aina kun selainikkuna suljetaan. Tämä EI tee vastauksista "älykkäämpiä"
# tai kontekstitietoisia - ei ole oikeaa kielimallia joka lukisi historiaa
# ennen vastaamista (ks. src/spacemonkey/spc_facade.py). Tämä on rehellisesti
# vain pysyvä loki: käyttäjä (ja Spacemonkey UI) voi selata sitä, mutta
# itse vastauslogiikka ei vielä käytä sitä syötteenä.
HISTORY_FILE = os.path.join(
    os.path.dirname(__file__), "..", "data", "chat_history.json"
)
MAX_HISTORY_ENTRIES = 200


def load_chat_history() -> List[Dict[str, Any]]:
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def save_chat_history(entries: List[Dict[str, Any]]):
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)


def append_chat_entry(mode: str, message: str, reply: str):
    entries = load_chat_history()
    entries.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": mode,
        "message": message,
        "reply": reply,
    })
    # Rajataan tiedoston koko - vanhin pudotetaan pois kun raja ylittyy.
    entries = entries[-MAX_HISTORY_ENTRIES:]
    save_chat_history(entries)


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
        append_chat_entry(mode, payload.message, altrako_result.reply)
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
        append_chat_entry(mode, payload.message, joint_reply)
        return ChatResponse(
            mode="council",
            reply=joint_reply,
            spacemonkey=sm_result,
            altrako=altrako_result.model_dump(),
        )

    # Oletustila: spacemonkey
    sm_result = run_spacemonkey(text)
    append_chat_entry(mode, payload.message, sm_result["reply"])
    return ChatResponse(mode="spacemonkey", reply=sm_result["reply"], spacemonkey=sm_result)


@router.get("/history")
def get_chat_history(limit: int = 50):
    """Palauttaa viimeisimmät keskustelumerkinnät (PRD osio 6, keskustelumuisti)."""
    entries = load_chat_history()
    limit = max(1, min(limit, MAX_HISTORY_ENTRIES))
    return {"status": "success", "history": entries[-limit:]}
