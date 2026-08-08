import os
import re
import sys
import json
import subprocess
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

router = APIRouter()

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

HISTORY_FILE = os.path.join(
    os.path.dirname(__file__), "..", "data", "git_guardian_history.json"
)

# Repo-tason pre-commit-hook (.githooks/pre-commit) käyttää tätä samaa
# skanneria (src/spacemonkey/git_guardian.py) jokaisen committin yhteydessä.
# Käytetään samaa moduulia täällä, jotta ennakkotarkistus ja hookin
# lopullinen päätös eivät koskaan voi olla eri mieltä keskenään, eikä
# salaisuuskaavoja tarvitse ylläpitää kahdessa paikassa.
_SRC_PATH = os.path.join(PROJECT_ROOT, "src")
if _SRC_PATH not in sys.path:
    sys.path.insert(0, _SRC_PATH)

from spacemonkey.git_guardian import scan_file as spc_scan_file


class GitGuardianStatusResponse(BaseModel):
    online: bool
    branch: Optional[str] = None
    changes: int = 0
    changed_files: List[str] = []
    is_dirty: bool = False
    security: Dict[str, Any] = {}
    error: Optional[str] = None


class BackupResponse(BaseModel):
    success: bool
    message: str
    commit: Optional[str] = None
    pushed: Optional[bool] = None
    files: Optional[List[str]] = None
    risks: Optional[List[Dict[str, str]]] = None


class RestoreRequest(BaseModel):
    commit: str


class RestoreResponse(BaseModel):
    success: bool
    message: str
    restored_commit: Optional[str] = None
    new_commit: Optional[str] = None
    pushed: Optional[bool] = None
    risks: Optional[List[Dict[str, str]]] = None


COMMIT_HASH_PATTERN = re.compile(r"^[0-9a-fA-F]{7,40}$")


def run_git(args: List[str]) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
        timeout=10,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} epäonnistui")
    # rstrip only: porcelain output uses meaningful leading spaces per line
    return result.stdout.rstrip("\n")


def get_changed_files() -> List[str]:
    status_output = run_git(["status", "--porcelain"])
    files = []
    for line in status_output.splitlines():
        if not line.strip():
            continue
        files.append(line[3:].strip())
    return files


def scan_files(files: List[str]) -> Dict[str, Any]:
    """Estää salaisuuksien ja vaarallisten tiedostojen puskemisen (PRD osio 6, Security
    Scanner). Käyttää samaa skanneria kuin repositoryn pre-commit-hook."""
    risks = []

    for file in files:
        full_path = os.path.join(PROJECT_ROOT, file)
        for risk in spc_scan_file(full_path):
            risks.append({
                "file": file,
                "type": risk.risk_type,
                "reason": risk.reason,
            })

    return {
        "safe": len(risks) == 0,
        "risks": risks,
    }


def get_git_status() -> Dict[str, Any]:
    try:
        branch = run_git(["rev-parse", "--abbrev-ref", "HEAD"])
        changed_files = get_changed_files()
        security = scan_files(changed_files)

        return {
            "online": True,
            "branch": branch,
            "changes": len(changed_files),
            "changed_files": changed_files,
            "is_dirty": len(changed_files) > 0,
            "security": security,
        }
    except Exception as error:
        return {
            "online": False,
            "error": str(error),
        }


def load_history() -> List[Dict[str, Any]]:
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def save_history(entries: List[Dict[str, Any]]):
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)


def append_history_entry(entry: Dict[str, Any]):
    entries = load_history()
    entries.append(entry)
    save_history(entries)


def create_backup() -> Dict[str, Any]:
    """Turvallinen commit + push. Ei koskaan force-pushia, branchien poistoa tai historian
    uudelleenkirjoitusta - näitä komentoja ei kutsuta missään koodipolussa (PRD osio 10)."""
    status = get_git_status()

    if not status["online"]:
        return {
            "success": False,
            "message": f"Git Guardian ei tavoita repositoryä: {status.get('error')}",
        }

    if not status["is_dirty"]:
        return {
            "success": True,
            "message": "Ei uusia muutoksia varmuuskopioitavaksi.",
        }

    security = status["security"]
    if not security["safe"]:
        return {
            "success": False,
            "message": "🛑 Varmuuskopiointi ESTETTY: Turvallisuusriski havaittu!",
            "risks": security["risks"],
        }

    changed_files = status["changed_files"]

    run_git(["add", "-A"])
    commit_message = f"Git Guardian checkpoint - {datetime.now(timezone.utc).isoformat()}"
    run_git(["commit", "-m", commit_message])
    commit_hash = run_git(["rev-parse", "--short", "HEAD"])

    pushed = True
    push_error = None
    try:
        run_git(["push"])
    except RuntimeError as error:
        pushed = False
        push_error = str(error)

    entry = {
        "date": datetime.now(timezone.utc).isoformat(),
        "commit": commit_hash,
        "files": changed_files,
        "status": "pushed" if pushed else "committed_no_push",
        "verified": pushed,
        "message": commit_message,
    }
    append_history_entry(entry)

    if not pushed:
        return {
            "success": True,
            "message": f"Committi luotu, mutta push epäonnistui: {push_error}",
            "commit": commit_hash,
            "pushed": False,
            "files": changed_files,
        }

    return {
        "success": True,
        "message": "✅ Varmuuskopiointi onnistui.",
        "commit": commit_hash,
        "pushed": True,
        "files": changed_files,
    }


def get_restore_points() -> List[Dict[str, Any]]:
    """Numeroidut, vahvistetut palautuspisteet (PRD osio 3, Palautuspisteet / Stable Build)."""
    entries = load_history()
    points = []
    build_number = 0
    for entry in entries:
        if not entry.get("verified"):
            continue
        build_number += 1
        points.append({
            "build": f"#{build_number:03d}",
            "date": entry["date"],
            "commit": entry["commit"],
            "status": "Verified",
        })
    return points


def restore_to_commit(commit: str) -> Dict[str, Any]:
    """Palauttaa työhakemiston tiedostot valittuun committiin ilman historian
    uudelleenkirjoitusta - palautus tallennetaan itse uutena committina, joten
    mikään aiempi commit ei koskaan katoa eikä historiaa kirjoiteta uudelleen
    (PRD osio 3 Palautuspisteet ja osio 10 turvallisuussäännöt)."""
    try:
        run_git(["cat-file", "-e", commit])
    except RuntimeError:
        return {
            "success": False,
            "message": f"Committia {commit} ei löytynyt.",
        }

    pre_status = get_git_status()
    if not pre_status["online"]:
        return {
            "success": False,
            "message": f"Git Guardian ei tavoita repositoryä: {pre_status.get('error')}",
        }

    if pre_status["is_dirty"]:
        safety_backup = create_backup()
        if not safety_backup["success"]:
            return {
                "success": False,
                "message": f"Palautus keskeytetty: nykyisiä muutoksia ei saatu varmuuskopioitua turvallisesti ennen palautusta. {safety_backup['message']}",
                "risks": safety_backup.get("risks"),
            }

    # Tyhjennä työhakemisto ja index, ja täytä ne uudelleen valitun committin
    # tiedostoilla. Tämä käsittelee oikein myös tiedostot, jotka on lisätty
    # committin jälkeen (pelkkä "checkout -- ." ei poistaisi niitä).
    run_git(["rm", "-rf", "--ignore-unmatch", "."])
    run_git(["checkout", commit, "--", "."])

    post_status = get_git_status()
    if not post_status["is_dirty"]:
        return {
            "success": True,
            "message": "Järjestelmä on jo valitussa tilassa, ei uutta committia tarvittu.",
            "restored_commit": commit,
        }

    security = post_status["security"]
    if not security["safe"]:
        # Palauta työhakemisto ennalleen, älä koskaan puske turvariskiä sisältävää tilaa
        run_git(["checkout", "HEAD", "--", "."])
        return {
            "success": False,
            "message": "🛑 Palautus ESTETTY: kohdecommit sisältää turvallisuusriskin.",
            "risks": security["risks"],
        }

    run_git(["add", "-A"])
    commit_message = f"Git Guardian restore to {commit}"
    run_git(["commit", "-m", commit_message])
    new_commit = run_git(["rev-parse", "--short", "HEAD"])

    pushed = True
    push_error = None
    try:
        run_git(["push"])
    except RuntimeError as error:
        pushed = False
        push_error = str(error)

    entry = {
        "date": datetime.now(timezone.utc).isoformat(),
        "commit": new_commit,
        "files": post_status["changed_files"],
        "status": "pushed" if pushed else "committed_no_push",
        "verified": pushed,
        "message": commit_message,
        "restored_from": commit,
    }
    append_history_entry(entry)

    if not pushed:
        return {
            "success": True,
            "message": f"Palautus tehty, mutta push epäonnistui: {push_error}",
            "restored_commit": commit,
            "new_commit": new_commit,
            "pushed": False,
        }

    return {
        "success": True,
        "message": "✅ Palautus onnistui.",
        "restored_commit": commit,
        "new_commit": new_commit,
        "pushed": True,
    }


@router.get("/status", response_model=GitGuardianStatusResponse)
def gitguardian_status():
    """Palauttaa repositoryn tilan, muutokset ja turvaskannauksen (PRD osio 8, Status)."""
    return get_git_status()


@router.post("/backup", response_model=BackupResponse)
def gitguardian_backup():
    """Turvatarkistettu commit + push (PRD osio 8, Backup / Safe Mode)."""
    return create_backup()


@router.get("/history")
def gitguardian_history():
    """Palauttaa Guardian History -lokin (PRD osio 8, History)."""
    return {"status": "success", "history": load_history()}


@router.get("/restore-points")
def gitguardian_restore_points():
    """Palauttaa numeroidut, vahvistetut palautuspisteet (PRD osio 3, Palautuspisteet)."""
    return {"status": "success", "restore_points": get_restore_points()}


@router.post("/restore", response_model=RestoreResponse)
def gitguardian_restore(payload: RestoreRequest):
    """Palauttaa repositoryn valittuun, vahvistettuun committiin turvallisesti (PRD osio 3)."""
    if not COMMIT_HASH_PATTERN.match(payload.commit):
        return {"success": False, "message": "Virheellinen commit-tunniste."}
    return restore_to_commit(payload.commit)
