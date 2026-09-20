import os
import json
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from backend.modules.paths import PY_DATA_DIR

router = APIRouter()

# Oli aiemmin CWD-suhteellinen ("backend/data_store.json") - toimi vain
# sattumalta, koska palvelin on aina käynnistetty repositoryn juuresta.
# __file__-suhteellinen kaikkien muidenkin moduulien tapaan (ks.
# backend/modules/paths.py) - toimii riippumatta mistä prosessi käynnistyy.
DATA_FILE = os.path.join(PY_DATA_DIR, "data_store.json")

class MemoryEntry(BaseModel):
    title: str
    content: str
    category: Optional[str] = "general"

def load_data() -> Dict[str, Any]:
    if not os.path.exists(DATA_FILE):
        return {"memories": [], "logs": []}
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"memories": [], "logs": []}

def save_data(data: Dict[str, Any]):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@router.get("/memories")
def get_memories():
    """Hakee tallennetut muistimerkinnät."""
    data = load_data()
    return {"status": "success", "memories": data.get("memories", [])}

@router.post("/memories/add")
def add_memory(entry: MemoryEntry):
    """Tallentaa uuden muistimerkinnän levylle."""
    data = load_data()
    new_entry = {
        "title": entry.title,
        "content": entry.content,
        "category": entry.category
    }
    data.setdefault("memories", []).append(new_entry)
    save_data(data)
    return {"status": "success", "message": "Muisti tallennettu levylle", "entry": new_entry}


class NotesPayload(BaseModel):
    content: str


@router.get("/notes")
def get_notes():
    """Hakee Muistio-sovelluksen tallennetun sisällön (yksi jatkuva dokumentti,
    eri asia kuin memories-lista joka kasvaa jokaisella tallennuksella)."""
    data = load_data()
    return {"status": "success", "content": data.get("notes_content", "")}


@router.post("/notes")
def save_notes(payload: NotesPayload):
    """Ylikirjoittaa Muistion sisällön levylle."""
    data = load_data()
    data["notes_content"] = payload.content
    save_data(data)
    return {"status": "success"}


class SettingsPayload(BaseModel):
    key: str
    value: bool


@router.get("/settings")
def get_settings():
    """Hakee tallennetut asetukset levyltä."""
    data = load_data()
    return {"status": "success", "settings": data.get("settings", {})}


@router.post("/settings")
def update_settings(payload: SettingsPayload):
    """Tallentaa yhden asetuksen levylle - oikeasti pysyvä, ei vain muistissa."""
    data = load_data()
    data.setdefault("settings", {})[payload.key] = payload.value
    save_data(data)
    return {"status": "success", "settings": data["settings"]}
