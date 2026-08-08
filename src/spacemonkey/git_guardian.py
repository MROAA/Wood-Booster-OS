"""
GitGuardian Module - Wood-Booster-OS / Spacemonkeybrain

Tarkistaa commit-vaiheeseen menevät tiedostot ennen kuin ne tallentuvat
versiohistoriaan. Estää salaisuuksien (API-avaimet, yksityiset avaimet,
tunnistetiedot) ja tunnetusti vaarallisten tiedostojen vahingossa
tallentumisen.

Ei koskaan aja mielivaltaisia komentoja - vain kiinteä git-komento
kiinteillä argumenteilla, ei koskaan käyttäjän syötettä komentorivillä.
"""

import re
import subprocess
from dataclasses import dataclass, field
from typing import List


BLOCKED_FILENAME_PATTERNS = [
    re.compile(r"(^|/)\.env(\..*)?$"),
    re.compile(r"\.pem$"),
    re.compile(r"\.key$"),
    re.compile(r"(^|/)id_rsa$"),
    re.compile(r"(^|/)id_ed25519$"),
    re.compile(r"credentials\.json$"),
    re.compile(r"(^|/)\.npmrc$"),
    re.compile(r"\.pfx$"),
    re.compile(r"\.p12$"),
]

SECRET_CONTENT_PATTERNS = [
    ("API_KEY assignment", re.compile(r"API_KEY\s*=\s*['\"]?[A-Za-z0-9_\-]{8,}")),
    ("GitHub token", re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}")),
    ("Stripe live key", re.compile(r"sk_live_[A-Za-z0-9]{16,}")),
    ("AWS access key", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("Private key block", re.compile(r"-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----")),
    ("Generic secret assignment", re.compile(r"(?i)(secret|password|passwd)\s*=\s*['\"][^'\"]{6,}['\"]")),
]

MAX_SCAN_BYTES = 1_000_000


@dataclass
class GuardianRisk:
    file: str
    risk_type: str
    reason: str


@dataclass
class GuardianReport:
    safe: bool
    changed_files: List[str] = field(default_factory=list)
    risks: List[GuardianRisk] = field(default_factory=list)


def _run_git(args: List[str]) -> str:
    """Ajaa git-komennon kiinteällä argumenttilistalla. Ei koskaan shell=True."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        check=False,
    )
    return result.stdout


def get_staged_files() -> List[str]:
    """Palauttaa commitiin menossa olevat tiedostot (lisätyt/muokatut, ei poistetut)."""
    output = _run_git(["diff", "--cached", "--name-only", "--diff-filter=ACM"])
    return [line.strip() for line in output.splitlines() if line.strip()]


def _scan_filename(path: str) -> List[GuardianRisk]:
    risks = []
    for pattern in BLOCKED_FILENAME_PATTERNS:
        if pattern.search(path):
            risks.append(
                GuardianRisk(
                    file=path,
                    risk_type="BLOCKED_FILE",
                    reason=f"Kielletty tiedostonimi/muoto: {pattern.pattern}",
                )
            )
    return risks


def _scan_content(path: str) -> List[GuardianRisk]:
    risks = []
    try:
        with open(path, "rb") as f:
            raw = f.read(MAX_SCAN_BYTES)
    except (FileNotFoundError, IsADirectoryError, PermissionError):
        return risks

    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return risks  # Binääritiedostoa ei skannata tekstinä

    for label, pattern in SECRET_CONTENT_PATTERNS:
        if pattern.search(text):
            risks.append(
                GuardianRisk(
                    file=path,
                    risk_type="SECRET_PATTERN",
                    reason=f"Löytyi mahdollinen salaisuus ({label})",
                )
            )
    return risks


def scan_file(path: str) -> List[GuardianRisk]:
    """Skannaa yhden tiedoston sekä nimen että sisällön perusteella."""
    return _scan_filename(path) + _scan_content(path)


def scan_staged_changes() -> GuardianReport:
    """Skannaa kaikki commitiin menossa olevat tiedostot."""
    changed_files = get_staged_files()
    all_risks: List[GuardianRisk] = []

    for path in changed_files:
        all_risks.extend(scan_file(path))

    return GuardianReport(
        safe=len(all_risks) == 0,
        changed_files=changed_files,
        risks=all_risks,
    )
