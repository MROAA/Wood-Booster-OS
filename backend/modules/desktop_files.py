import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# Boosterverse Desktop - tiedostonhallinta. VAIN luku, VAIN Wood-Booster-AI
# -projektikansion sisällä (Marcin oma rajaus). Ei koskaan kirjoita, siirrä
# tai poista mitään - se on tarkoituksella myöhempi, oma, vahvistusta
# vaativa ominaisuus.
ROOT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

MAX_READ_BYTES = 200_000

TEXT_EXTENSIONS = {
    ".txt", ".md", ".json", ".py", ".js", ".jsx", ".ts", ".tsx", ".css",
    ".html", ".yml", ".yaml", ".sh", ".cfg", ".ini", ".log", ".csv",
}


def resolve_safe_path(relative_path: str) -> str:
    """Yhdistää suhteellisen polun ROOT_DIR:iin ja varmistaa ettei tulos
    koskaan pääse ROOT_DIR:in ulkopuolelle - estää polkuliikennehyökkäykset
    (esim. '../../etc/passwd')."""
    relative_path = (relative_path or "").strip().lstrip("/")
    candidate = os.path.abspath(os.path.join(ROOT_DIR, relative_path))
    if candidate != ROOT_DIR and not candidate.startswith(ROOT_DIR + os.sep):
        raise HTTPException(status_code=403, detail="Polku on sallitun kansion ulkopuolella.")
    return candidate


class FileEntry(BaseModel):
    name: str
    path: str
    type: str
    size: Optional[int] = None


class ListResponse(BaseModel):
    path: str
    entries: List[FileEntry]


class ReadResponse(BaseModel):
    path: str
    readable: bool
    content: Optional[str] = None
    size: int
    message: Optional[str] = None


@router.get("/list", response_model=ListResponse)
def list_directory(path: str = ""):
    """Listaa kansion sisällön (PRD: Boosterverse Desktop, tiedostonhallinta)."""
    target = resolve_safe_path(path)
    if not os.path.isdir(target):
        raise HTTPException(status_code=404, detail="Kansiota ei löytynyt.")

    try:
        names = sorted(os.listdir(target))
    except PermissionError:
        raise HTTPException(status_code=403, detail="Ei lukuoikeutta tähän kansioon.")

    entries = []
    for name in names:
        if name.startswith("."):
            continue
        full = os.path.join(target, name)
        try:
            is_dir = os.path.isdir(full)
            size = None if is_dir else os.path.getsize(full)
        except OSError:
            continue
        rel = os.path.relpath(full, ROOT_DIR)
        entries.append(FileEntry(name=name, path=rel, type="dir" if is_dir else "file", size=size))

    entries.sort(key=lambda e: (e.type != "dir", e.name.lower()))
    current_rel = "" if target == ROOT_DIR else os.path.relpath(target, ROOT_DIR)
    return ListResponse(path=current_rel, entries=entries)


MAX_SEARCH_RESULTS = 50
MAX_SEARCH_SCAN = 20_000
SKIP_DIR_NAMES = {"node_modules", ".git", "venv", "build", ".dart_tool", "__pycache__"}


@router.get("/search", response_model=ListResponse)
def search_files(q: str):
    """Etsii tiedosto- ja kansionimiä koko sallitun kansion alta (rekursiivisesti).
    Sama sandbox kuin list/read-reiteillä - ei koskaan ROOT_DIR:in ulkopuolelle."""
    query = (q or "").strip().lower()
    if not query:
        return ListResponse(path="", entries=[])

    matches: List[FileEntry] = []
    scanned = 0
    for dirpath, dirnames, filenames in os.walk(ROOT_DIR):
        dirnames[:] = [d for d in dirnames if not d.startswith(".") and d not in SKIP_DIR_NAMES]
        for name in dirnames + filenames:
            scanned += 1
            if scanned > MAX_SEARCH_SCAN or len(matches) >= MAX_SEARCH_RESULTS:
                return ListResponse(path=query, entries=matches)
            if query in name.lower():
                full = os.path.join(dirpath, name)
                is_dir = os.path.isdir(full)
                try:
                    size = None if is_dir else os.path.getsize(full)
                except OSError:
                    continue
                rel = os.path.relpath(full, ROOT_DIR)
                matches.append(FileEntry(name=name, path=rel, type="dir" if is_dir else "file", size=size))

    return ListResponse(path=query, entries=matches)


@router.get("/read", response_model=ReadResponse)
def read_file(path: str):
    """Lukee tekstitiedoston sisällön esikatselua varten - vain luku, ei koskaan kirjoita."""
    target = resolve_safe_path(path)
    if not os.path.isfile(target):
        raise HTTPException(status_code=404, detail="Tiedostoa ei löytynyt.")

    size = os.path.getsize(target)
    ext = os.path.splitext(target)[1].lower()
    rel = os.path.relpath(target, ROOT_DIR)

    if ext not in TEXT_EXTENSIONS:
        return ReadResponse(path=rel, readable=False, size=size, message="Tiedostotyyppiä ei esikatsella (ei tekstitiedosto).")

    if size > MAX_READ_BYTES:
        return ReadResponse(path=rel, readable=False, size=size, message=f"Tiedosto on liian suuri esikatseluun ({size} tavua).")

    try:
        with open(target, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except OSError:
        return ReadResponse(path=rel, readable=False, size=size, message="Tiedostoa ei voitu lukea.")

    return ReadResponse(path=rel, readable=True, content=content, size=size)
