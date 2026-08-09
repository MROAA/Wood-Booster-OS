import os
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
from anthropic import Anthropic

from backend.modules.spacemonkey_core import run_spacemonkey

# .env elää backend/-kansiossa, ei repon juuressa.
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

router = APIRouter()

_api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
_client = Anthropic(api_key=_api_key) if _api_key else None

_CHAT_MODEL = "claude-sonnet-5"


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    inner_voice: str
    blocked: bool


@router.post("/chat", response_model=ChatResponse)
def spacemonkey_chat(payload: ChatRequest):
    """Oikea vapaa keskustelu Spacemonkeyn kanssa.

    Viesti kulkee ensin oikean Spacemonkey-ytimen (turvatarkistus,
    persoonallisuus, tunnetila) läpi. Jos ydin estää viestin, ei kutsuta
    kielimallia lainkaan. Muuten ytimen persoonallisuustila muodostaa
    system-promptin kielimallille, ja sen todellinen tila näytetään
    erillisenä "inner_voice" -kenttänä - ei koskaan sekoitettuna itse
    vastaukseen, ks. src/spacemonkey/ periaate lore vs. status."""
    gate = run_spacemonkey(payload.message)
    profile = gate["system"]["personality_profile"]
    inner_voice = f"[{profile['primary_mode']}] {profile['tone_of_voice']}"

    if gate["status"] == "BLOCKED":
        return ChatResponse(reply=gate["reply"], inner_voice=inner_voice, blocked=True)

    if _client is None:
        return ChatResponse(
            reply="Spacemonkeylla ei ole vielä API-avainta käytössä (ANTHROPIC_API_KEY "
                  "puuttuu backend/.env-tiedostosta), joten en voi vastata vapaasti.",
            inner_voice=inner_voice,
            blocked=False,
        )

    system_prompt = (
        "Olet Spacemonkey, Wood-Booster HQ:n asuva tekoäly-operaattori Marc "
        "Järviselle. Vastaa suomeksi, suoraan ja avuliaasti. "
        f"Nykyinen persoonallisuustilasi on {profile['primary_mode']} "
        f"({profile['tone_of_voice']}) - anna sen näkyä äänensävyssäsi, "
        "mutta vastaa silti oikeasti käyttäjän kysymykseen."
    )

    response = _client.messages.create(
        model=_CHAT_MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": payload.message}],
    )
    reply_text = "".join(
        block.text for block in response.content if block.type == "text"
    ).strip()

    return ChatResponse(reply=reply_text, inner_voice=inner_voice, blocked=False)
