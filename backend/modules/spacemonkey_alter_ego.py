import random
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Altrakon tilanmuisti muistissa (laskurit ja mielialat)
altrako_state = {
    "blocked_attacks": 42,  # Aloitetaan tyylikkäästi valmiilla luvulla
    "moods": ["Hyper-Koodaaja 🚀", "Banaanifilosofi 🍌", "Köydessä roikkuva vahti 🐒", "Salamanvahva Palomuuri ⚡"]
}

class AltrakoRequest(BaseModel):
    command: str

class AltrakoResponse(BaseModel):
    name: str = "Altrako (Core Guardian & Shield 🐵🍌)"
    current_mood: str
    blocked_count: int
    reply: str

@router.post("/process", response_model=AltrakoResponse)
def process_altrako(req: AltrakoRequest):
    """
    Altrakon täydellinen suojelija-logiikka: Banaani-palomuuri, laskuri ja mielialat.
    """
    user_input = req.command.strip().lower()
    current_mood = random.choice(altrako_state["moods"])
    
    # 1. Tarkistetaan onko kyseessä hyökkäysyritys
    if any(w in user_input for w in ["sudo", "rm", "hack", "tuhoa", "delete"]):
        altrako_state["blocked_attacks"] += 1
        reply = (
            f"BANANA FIREWALL AKTIVOITU! 🍌🛡️ Nappasin tuon lennosta ja muutin koodisi banaanismoothieksi! "
            f"Tänään on torjuttu jo {altrako_state['blocked_attacks']} yritystä. Ydin elää!"
        )
    # 2. Status- tai tilakyselyt
    elif any(w in user_input for w in ["status", "tila", "turva", "montako"]):
        reply = (
            f"Järjestelmän pulssi on katossa! Olen torjunut tänään yhteensä {altrako_state['blocked_attacks']} "
            f"vaarallista yritystä. Mieliala tällä hetkellä: {current_mood}!"
        )
    # 3. Yleinen höpinä
    else:
        reply = (
            f"Ooo! Komento '{req.command}' vastaanotettu. {current_mood} tarkasti sen ja totesi "
            f"että mennään eteenpäin tukka putkella! Mitäs seuraavaksi suojellaan?!"
        )

    return AltrakoResponse(
        current_mood=current_mood,
        blocked_count=altrako_state["blocked_attacks"],
        reply=reply
    )
