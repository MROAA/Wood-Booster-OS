import os
import re
import sys
import json
import subprocess
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from backend.modules.paths import SOURCE_ROOT, GIT_ROOT, PY_DATA_DIR

router = APIRouter()

# Mitä repositoryä vasten git-komennot ajetaan - kehitystilassa Marcin
# elävä checkout, asennetussa sovelluksessa sama, WOOD_BOOSTER_GIT_ROOT
# -ympäristömuuttujan kautta (ks. backend/modules/paths.py). Ei koskaan
# resurssikimpun oma kopio - siinä ei ole edes .git-kansiota.
PROJECT_ROOT = GIT_ROOT

HISTORY_FILE = os.path.join(PY_DATA_DIR, "git_guardian_history.json")

# Repo-tason pre-commit-hook (.githooks/pre-commit) käyttää tätä samaa
# skanneria (src/spacemonkey/git_guardian.py) jokaisen committin yhteydessä.
# Käytetään samaa moduulia täällä, jotta ennakkotarkistus ja hookin
# lopullinen päätös eivät koskaan voi olla eri mieltä keskenään, eikä
# salaisuuskaavoja tarvitse ylläpitää kahdessa paikassa. Lähdekoodin
# sijainti on aina __file__-suhteellinen (SOURCE_ROOT), ei GIT_ROOT -
# src/spacemonkey/ paketoidaan aina backendin viereen.
_SRC_PATH = os.path.join(SOURCE_ROOT, "src")
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

# Checkpointit menevät AINA tälle erilliselle branchille, ei koskaan
# suoraan sille branchille joka sattuu olemaan checkoutissa (development/
# main). Tämä on tarkoituksella eri asia kuin repositoryn worktree+PR-
# työnkulku (docs/GIT_WORKFLOW.md) - Git Guardian on nopea, automaattinen
# turvaverkko, ei koskaan tarkoitettu ohittamaan sitä.
BACKUP_BRANCH = "git-guardian/backups"


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


def _backup_branch_parent() -> str:
    """Löytää git-guardian/backups-branchin nykyisen kärjen (paikallinen tai
    remote), tai HEAD jos branchia ei ole vielä olemassa lainkaan."""
    for ref in (f"refs/heads/{BACKUP_BRANCH}", f"refs/remotes/origin/{BACKUP_BRANCH}"):
        try:
            return run_git(["rev-parse", ref])
        except RuntimeError:
            continue
    return run_git(["rev-parse", "HEAD"])


def _commit_snapshot_to_backup_branch(commit_message: str) -> str:
    """Ottaa nykyisen työhakemiston tilan talteen omana committinaan
    git-guardian/backups-branchille git-plumbingilla (write-tree +
    commit-tree + update-ref) - HEAD ja nykyinen checkout eivät liiku
    hetkeksikään. Tämä ei koskaan kosketa developmentia/maina eikä häiritse
    samassa hakemistossa mahdollisesti samaan aikaan työskenteleviä muita
    sessioita. Palauttaa uuden committin täyden SHA:n."""
    run_git(["add", "-A"])
    try:
        tree_sha = run_git(["write-tree"])
        parent = _backup_branch_parent()
        new_commit = run_git(["commit-tree", tree_sha, "-p", parent, "-m", commit_message])
        run_git(["update-ref", f"refs/heads/{BACKUP_BRANCH}", new_commit])
    finally:
        # Mixed reset: palauttaa vain indeksin (staging-alueen) ennalleen.
        # Työhakemiston tiedostot eivät muutu - käyttäjän oma checkout
        # pysyy täsmälleen samassa, koskemattomassa tilassa kuin ennen.
        run_git(["reset"])
    return new_commit


def create_backup() -> Dict[str, Any]:
    """Ottaa turvatarkistetun snapshotin nykyisestä työhakemistosta erilliselle
    git-guardian/backups-branchille. Ei koskaan force-pushia, branchien poistoa,
    historian uudelleenkirjoitusta EIKÄ committia/pushia sille branchille joka
    sattuu olemaan checkoutissa (PRD osio 10 + korjaus 2026-08-09: aiempi versio
    pushasi vahingossa suoraan development-branchille)."""
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

    commit_message = f"Git Guardian checkpoint - {datetime.now(timezone.utc).isoformat()}"
    commit_hash_full = _commit_snapshot_to_backup_branch(commit_message)
    commit_hash = commit_hash_full[:7]

    pushed = True
    push_error = None
    try:
        run_git(["push", "origin", f"refs/heads/{BACKUP_BRANCH}:refs/heads/{BACKUP_BRANCH}"])
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
            "message": f"Snapshot otettu talteen {BACKUP_BRANCH}-branchille, mutta push epäonnistui: {push_error}",
            "commit": commit_hash,
            "pushed": False,
            "files": changed_files,
        }

    return {
        "success": True,
        "message": f"✅ Varmuuskopiointi onnistui ({BACKUP_BRANCH}-branchille, oma checkoutisi pysyi koskemattomana).",
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
    """Palauttaa työhakemiston TIEDOSTOT (ei branchia/HEADia) valittuun committiin.
    Tuloksena olevat muutokset jätetään tallentamattomiksi nykyiselle branchille -
    käyttäjä näkee ja committoi ne itse normaalisti (worktree+PR-työnkulun kautta,
    docs/GIT_WORKFLOW.md) - Git Guardian ei koskaan committoi/pushaa niitä suoraan
    development/main-branchille puolestasi. Restaus-tapahtuma tallennetaan omana
    merkintänään git-guardian/backups-branchille historiaa varten samalla tavalla
    kuin create_backup() (PRD osio 3 Palautuspisteet ja osio 10 turvallisuussäännöt)."""
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

    # Tiedostot ovat nyt palautetussa tilassa työhakemistossa, mutta
    # tallentamattomina nykyiselle branchille - Git Guardian ei koskaan
    # committoi/pushaa tätä puolestasi. Merkintä restauksesta talletetaan
    # silti git-guardian/backups-branchille (samalla turvallisella
    # plumbing-mekanismilla kuin create_backup), jotta se näkyy historiassa.
    restore_commit_message = f"Git Guardian restore event to {commit}"
    marker_commit_full = _commit_snapshot_to_backup_branch(restore_commit_message)
    marker_commit = marker_commit_full[:7]

    pushed = True
    push_error = None
    try:
        run_git(["push", "origin", f"refs/heads/{BACKUP_BRANCH}:refs/heads/{BACKUP_BRANCH}"])
    except RuntimeError as error:
        pushed = False
        push_error = str(error)

    entry = {
        "date": datetime.now(timezone.utc).isoformat(),
        "commit": marker_commit,
        "files": post_status["changed_files"],
        "status": "pushed" if pushed else "committed_no_push",
        "verified": pushed,
        "message": restore_commit_message,
        "restored_from": commit,
    }
    append_history_entry(entry)

    return {
        "success": True,
        "message": (
            "✅ Tiedostot palautettu työhakemistoosi (tallentamattomina - "
            "katso ja committoi ne itse kun olet valmis). Palautustapahtuma "
            f"kirjattu {BACKUP_BRANCH}-branchille."
        ),
        "restored_commit": commit,
        "new_commit": marker_commit,
        "pushed": pushed,
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
