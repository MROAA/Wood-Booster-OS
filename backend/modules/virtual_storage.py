import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from PIL import Image

from backend.modules.paths import PY_DATA_DIR

router = APIRouter()

DATA_DIR = PY_DATA_DIR
DATA_FILE = os.path.join(DATA_DIR, "virtual_storage.json")
FILES_DIR = os.path.join(DATA_DIR, "virtual_storage_files")

THUMBNAIL_SIZE = (320, 320)


def load_data() -> Dict[str, Any]:
    if not os.path.exists(DATA_FILE):
        return {"folders": {}, "files": {}}
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"folders": {}, "files": {}}


def save_data(data: Dict[str, Any]):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class CreateFolderRequest(BaseModel):
    name: str
    parent_id: Optional[str] = None


@router.get("/folders")
def list_folder(parent_id: Optional[str] = None):
    """Listaa yhden kansiotason sisällön (kansiot + tiedostot). "Litteä"
    tietomalli - ei sisäkkäisiä lapsi-listoja - suodatetaan aina
    pyynnön yhteydessä, sama kuormaperiaate kuin desktop_files.py:n
    tiedostojärjestelmän kävelyllä joka pyynnöllä."""
    data = load_data()
    folders = [
        f for f in data["folders"].values()
        if f.get("parent_id") == parent_id
    ]
    files = [
        f for f in data["files"].values()
        if f.get("folder_id") == parent_id
    ]
    return {"parent_id": parent_id, "folders": folders, "files": files}


@router.post("/folders")
def create_folder(payload: CreateFolderRequest):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Kansion nimi ei voi olla tyhjä.")

    data = load_data()
    if payload.parent_id is not None and payload.parent_id not in data["folders"]:
        raise HTTPException(status_code=404, detail="Yläkansiota ei löytynyt.")

    folder_id = f"f-{uuid.uuid4()}"
    entry = {
        "id": folder_id,
        "name": name,
        "parent_id": payload.parent_id,
        "created_at": now_iso(),
    }
    data["folders"][folder_id] = entry
    save_data(data)
    return entry


def _guess_category(mime_type: str) -> str:
    if mime_type.startswith("image/"):
        return "image"
    if mime_type.startswith("video/"):
        return "video"
    if mime_type == "application/pdf":
        return "pdf"
    if mime_type in (
        "application/zip", "application/x-zip-compressed",
        "application/x-tar", "application/gzip",
    ):
        return "archive"
    return "generic"


def _make_thumbnail(source_path: str, dest_path: str) -> bool:
    try:
        with Image.open(source_path) as img:
            img = img.convert("RGB")
            img.thumbnail(THUMBNAIL_SIZE)
            img.save(dest_path, "JPEG", quality=82)
        return True
    except Exception:
        return False


@router.post("/upload")
async def upload_file(file: UploadFile, folder_id: Optional[str] = Form(None)):
    data = load_data()
    if folder_id is not None and folder_id not in data["folders"]:
        raise HTTPException(status_code=404, detail="Kohdekansiota ei löytynyt.")

    os.makedirs(FILES_DIR, exist_ok=True)

    original_name = file.filename or "tiedosto"
    ext = os.path.splitext(original_name)[1]
    stored_name = f"{uuid.uuid4()}{ext}"
    stored_path = os.path.join(FILES_DIR, stored_name)

    contents = await file.read()
    with open(stored_path, "wb") as out:
        out.write(contents)

    mime_type = file.content_type or "application/octet-stream"
    category = _guess_category(mime_type)

    has_thumbnail = False
    if category == "image":
        thumb_path = os.path.join(FILES_DIR, f"{stored_name}_thumb.jpg")
        has_thumbnail = _make_thumbnail(stored_path, thumb_path)

    file_id = f"file-{uuid.uuid4()}"
    entry = {
        "id": file_id,
        "folder_id": folder_id,
        "original_name": original_name,
        "stored_name": stored_name,
        "mime_type": mime_type,
        "category": category,
        "size_bytes": len(contents),
        "has_thumbnail": has_thumbnail,
        "uploaded_at": now_iso(),
    }
    data["files"][file_id] = entry
    save_data(data)
    return entry


@router.get("/files/{file_id}/download")
def download_file(file_id: str):
    data = load_data()
    entry = data["files"].get(file_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Tiedostoa ei löytynyt.")

    stored_path = os.path.join(FILES_DIR, entry["stored_name"])
    if not os.path.isfile(stored_path):
        raise HTTPException(status_code=404, detail="Tiedosto puuttuu levyltä.")

    return FileResponse(
        stored_path,
        media_type=entry["mime_type"],
        filename=entry["original_name"],
    )


@router.get("/files/{file_id}/thumbnail")
def get_thumbnail(file_id: str):
    data = load_data()
    entry = data["files"].get(file_id)
    if not entry or not entry.get("has_thumbnail"):
        raise HTTPException(status_code=404, detail="Esikatselukuvaa ei ole.")

    thumb_path = os.path.join(FILES_DIR, f"{entry['stored_name']}_thumb.jpg")
    if not os.path.isfile(thumb_path):
        raise HTTPException(status_code=404, detail="Esikatselukuvaa ei ole.")

    return FileResponse(thumb_path, media_type="image/jpeg")


class MoveFileRequest(BaseModel):
    folder_id: Optional[str] = None


@router.patch("/files/{file_id}/move")
def move_file(file_id: str, payload: MoveFileRequest):
    data = load_data()
    entry = data["files"].get(file_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Tiedostoa ei löytynyt.")
    if payload.folder_id is not None and payload.folder_id not in data["folders"]:
        raise HTTPException(status_code=404, detail="Kohdekansiota ei löytynyt.")

    entry["folder_id"] = payload.folder_id
    save_data(data)
    return entry


@router.delete("/files/{file_id}")
def delete_file(file_id: str):
    data = load_data()
    entry = data["files"].pop(file_id, None)
    if not entry:
        raise HTTPException(status_code=404, detail="Tiedostoa ei löytynyt.")

    save_data(data)

    stored_path = os.path.join(FILES_DIR, entry["stored_name"])
    if os.path.isfile(stored_path):
        os.remove(stored_path)
    thumb_path = os.path.join(FILES_DIR, f"{entry['stored_name']}_thumb.jpg")
    if os.path.isfile(thumb_path):
        os.remove(thumb_path)

    return {"status": "success"}


@router.delete("/folders/{folder_id}")
def delete_folder(folder_id: str):
    data = load_data()
    if folder_id not in data["folders"]:
        raise HTTPException(status_code=404, detail="Kansiota ei löytynyt.")

    has_subfolder = any(f.get("parent_id") == folder_id for f in data["folders"].values())
    has_file = any(f.get("folder_id") == folder_id for f in data["files"].values())
    if has_subfolder or has_file:
        raise HTTPException(
            status_code=400,
            detail="Kansio ei ole tyhjä - poista sisältö ensin.",
        )

    del data["folders"][folder_id]
    save_data(data)
    return {"status": "success"}
