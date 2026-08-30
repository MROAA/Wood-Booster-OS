#!/usr/bin/env python3

"""
Heartwood Patch Tool
====================

A safe, AI-friendly development patch tool for the Heartwood project.

Features:
- Project root detection
- Patch file validation
- Dry-run support
- File snapshots
- Unified diffs
- Safe patch application
- Automatic rollback on failure
- Git status inspection
- Build/test hooks
- JSON output for AI agents
- Patch history

Initial version:
Heartwood Dev Studio
"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any


# ============================================================
# CONFIGURATION
# ============================================================

TOOL_NAME = "Heartwood Patch Tool"
VERSION = "0.1.0"

PATCH_DIR_NAME = ".heartwood-patchbay"
SNAPSHOT_DIR_NAME = "snapshots"
HISTORY_FILE_NAME = "history.json"

PROTECTED_PATHS = [
    ".git",
    ".env",
    ".env.local",
    "secrets",
    "saves",
    "production",
]

MAX_PATCH_SIZE = 5 * 1024 * 1024  # 5 MB


# ============================================================
# OUTPUT
# ============================================================

def info(message: str) -> None:
    print(f"[INFO] {message}")


def success(message: str) -> None:
    print(f"[OK]   {message}")


def warning(message: str) -> None:
    print(f"[WARN] {message}")


def error(message: str) -> None:
    print(f"[ERROR] {message}", file=sys.stderr)


# ============================================================
# PROJECT DETECTION
# ============================================================

def find_project_root(start: Path | None = None) -> Path:
    """
    Find the actual Heartwood project root.

    The tool deliberately refuses to use the user's home directory
    as the project root.

    Preferred detection:
    1. HEARTWOOD_PROJECT environment variable
    2. Current directory or its parents containing .heartwood/
    3. Current directory or its parents containing heartwood.project
    4. Current directory or its parents containing a dedicated
       Heartwood marker

    The user's home directory is never accepted automatically.
    """

    env_root = os.environ.get("HEARTWOOD_PROJECT")

    if env_root:
        root = Path(env_root).expanduser().resolve()

        if root == Path.home().resolve():
            raise RuntimeError(
                "HEARTWOOD_PROJECT cannot point to the home directory."
            )

        if not root.exists():
            raise RuntimeError(
                f"HEARTWOOD_PROJECT does not exist: {root}"
            )

        return root

    current = (start or Path.cwd()).resolve()
    home = Path.home().resolve()

    for directory in [current, *current.parents]:

        # Never treat /home/marc itself as the project.
        if directory == home:
            continue

        markers = [
            directory / ".heartwood",
            directory / "heartwood.project",
            directory / ".heartwood-project",
        ]

        if any(marker.exists() for marker in markers):
            return directory

    raise RuntimeError(
        "Heartwood project root not found.\n\n"
        "Run this command from the Heartwood project directory, "
        "or set HEARTWOOD_PROJECT explicitly:\n\n"
        "  export HEARTWOOD_PROJECT=/path/to/Heartwood\n"
    )
# ============================================================
# INTERNAL DIRECTORIES
# ============================================================

def patchbay_dir(root: Path) -> Path:
    return root / PATCH_DIR_NAME


def snapshots_dir(root: Path) -> Path:
    return patchbay_dir(root) / SNAPSHOT_DIR_NAME


def history_file(root: Path) -> Path:
    return patchbay_dir(root) / HISTORY_FILE_NAME


def ensure_patchbay_dirs(root: Path) -> None:
    snapshots_dir(root).mkdir(parents=True, exist_ok=True)


# ============================================================
# PATCH FILE
# ============================================================

def load_patch_file(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Patch file not found: {path}")

    if path.stat().st_size > MAX_PATCH_SIZE:
        raise ValueError("Patch file is too large.")

    try:
        content = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError("Patch file must be UTF-8 encoded.") from exc

    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(
            "Patch files currently use JSON format."
        ) from exc

    validate_patch(data)

    return data


def validate_patch(patch: dict[str, Any]) -> None:
    if not isinstance(patch, dict):
        raise ValueError("Patch must be a JSON object.")

    required = ["id", "name", "changes"]

    for field in required:
        if field not in patch:
            raise ValueError(f"Missing required patch field: {field}")

    if not isinstance(patch["id"], str):
        raise ValueError("Patch id must be a string.")

    if not isinstance(patch["name"], str):
        raise ValueError("Patch name must be a string.")

    if not isinstance(patch["changes"], list):
        raise ValueError("Patch changes must be a list.")

    for index, change in enumerate(patch["changes"]):
        if not isinstance(change, dict):
            raise ValueError(f"Change #{index + 1} must be an object.")

        if "file" not in change:
            raise ValueError(
                f"Change #{index + 1} is missing 'file'."
            )

        if "content" not in change:
            raise ValueError(
                f"Change #{index + 1} is missing 'content'."
            )

        if not isinstance(change["file"], str):
            raise ValueError(
                f"Change #{index + 1} file must be a string."
            )

        if not isinstance(change["content"], str):
            raise ValueError(
                f"Change #{index + 1} content must be a string."
            )


# ============================================================
# PATH SECURITY
# ============================================================

def safe_project_path(root: Path, relative_path: str) -> Path:
    """
    Resolve a patch path and make sure it stays inside project root.
    """

    if not relative_path:
        raise ValueError("Empty file path.")

    candidate = Path(relative_path)

    if candidate.is_absolute():
        raise ValueError(
            f"Absolute paths are not allowed: {relative_path}"
        )

    resolved = (root / candidate).resolve()

    try:
        resolved.relative_to(root.resolve())
    except ValueError as exc:
        raise ValueError(
            f"Path escapes project root: {relative_path}"
        ) from exc

    return resolved


def is_protected_path(root: Path, path: Path) -> bool:
    try:
        relative = path.resolve().relative_to(root.resolve())
    except ValueError:
        return True

    relative_string = str(relative)

    for protected in PROTECTED_PATHS:
        if relative_string == protected:
            return True

        if relative_string.startswith(protected + os.sep):
            return True

    return False


# ============================================================
# HASHING
# ============================================================

def file_hash(path: Path) -> str | None:
    if not path.exists() or not path.is_file():
        return None

    digest = hashlib.sha256()

    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)

    return digest.hexdigest()


# ============================================================
# SNAPSHOT
# ============================================================

def create_snapshot(
    root: Path,
    patch: dict[str, Any],
) -> Path:
    ensure_patchbay_dirs(root)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    patch_id = sanitize_patch_id(patch["id"])

    snapshot_path = snapshots_dir(root) / f"{timestamp}_{patch_id}"

    snapshot_path.mkdir(parents=True, exist_ok=True)

    manifest: list[dict[str, Any]] = []

    for change in patch["changes"]:
        target = safe_project_path(root, change["file"])

        if target.exists() and target.is_file():
            relative = target.relative_to(root)

            destination = snapshot_path / relative
            destination.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            shutil.copy2(target, destination)

            manifest.append(
                {
                    "file": str(relative),
                    "existed": True,
                    "hash": file_hash(target),
                }
            )
        else:
            manifest.append(
                {
                    "file": change["file"],
                    "existed": False,
                    "hash": None,
                }
            )

    manifest_path = snapshot_path / "manifest.json"

    manifest_path.write_text(
        json.dumps(
            {
                "patch_id": patch["id"],
                "patch_name": patch["name"],
                "created_at": datetime.now().isoformat(),
                "files": manifest,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    return snapshot_path


# ============================================================
# ROLLBACK
# ============================================================

def rollback_snapshot(
    root: Path,
    snapshot_path: Path,
) -> None:

    manifest_path = snapshot_path / "manifest.json"

    if not manifest_path.exists():
        raise RuntimeError(
            f"Snapshot manifest missing: {manifest_path}"
        )

    manifest = json.loads(
        manifest_path.read_text(encoding="utf-8")
    )

    for item in manifest["files"]:
        relative = Path(item["file"])
        target = safe_project_path(root, str(relative))

        backup = snapshot_path / relative

        if item["existed"]:
            if backup.exists():
                target.parent.mkdir(
                    parents=True,
                    exist_ok=True,
                )

                shutil.copy2(backup, target)

        else:
            if target.exists():
                if target.is_file():
                    target.unlink()
                elif target.is_dir():
                    shutil.rmtree(target)

    success("Rollback completed.")


# ============================================================
# DIFF
# ============================================================

def generate_diff(
    root: Path,
    file_path: Path,
    new_content: str,
) -> str:

    relative = file_path.relative_to(root)

    if file_path.exists():
        old_content = file_path.read_text(
            encoding="utf-8"
        )
    else:
        old_content = ""

    old_lines = old_content.splitlines(keepends=True)
    new_lines = new_content.splitlines(keepends=True)

    diff = difflib.unified_diff(
        old_lines,
        new_lines,
        fromfile=f"a/{relative}",
        tofile=f"b/{relative}",
    )

    return "".join(diff)


# ============================================================
# PATCH ANALYSIS
# ============================================================

def calculate_risk(patch: dict[str, Any]) -> str:
    files = [
        str(change["file"]).lower()
        for change in patch["changes"]
    ]

    critical_keywords = [
        "save",
        "database",
        "migration",
        "gameengine",
        "combatengine",
        "core",
    ]

    high_keywords = [
        "combat",
        "runtime",
        "game_loop",
        "gamelogic",
    ]

    for file in files:
        if any(keyword in file for keyword in critical_keywords):
            return "CRITICAL"

    for file in files:
        if any(keyword in file for keyword in high_keywords):
            return "HIGH"

    if len(files) >= 10:
        return "MEDIUM"

    return "LOW"


def analyze_patch(
    root: Path,
    patch: dict[str, Any],
) -> dict[str, Any]:

    changes = []

    total_added = 0
    total_removed = 0

    for change in patch["changes"]:
        target = safe_project_path(
            root,
            change["file"],
        )

        diff = generate_diff(
            root,
            target,
            change["content"],
        )

        added = 0
        removed = 0

        for line in diff.splitlines():
            if line.startswith("+") and not line.startswith("+++"):
                added += 1

            if line.startswith("-") and not line.startswith("---"):
                removed += 1

        total_added += added
        total_removed += removed

        changes.append(
            {
                "file": change["file"],
                "exists": target.exists(),
                "added": added,
                "removed": removed,
                "protected": is_protected_path(
                    root,
                    target,
                ),
            }
        )

    return {
        "patch_id": patch["id"],
        "name": patch["name"],
        "risk": calculate_risk(patch),
        "files": changes,
        "total_added": total_added,
        "total_removed": total_removed,
    }


# ============================================================
# GIT
# ============================================================

def git_status(root: Path) -> str:
    result = subprocess.run(
        ["git", "status", "--short"],
        cwd=root,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        return "Git unavailable"

    return result.stdout.strip()


def git_is_repository(root: Path) -> bool:
    result = subprocess.run(
        ["git", "rev-parse", "--is-inside-work-tree"],
        cwd=root,
        capture_output=True,
        text=True,
    )

    return (
        result.returncode == 0
        and result.stdout.strip() == "true"
    )


# ============================================================
# COMMAND EXECUTION
# ============================================================

def run_command(
    command: list[str],
    root: Path,
    label: str,
) -> bool:

    info(f"Running: {label}")

    result = subprocess.run(
        command,
        cwd=root,
    )

    if result.returncode != 0:
        error(
            f"{label} failed with exit code "
            f"{result.returncode}"
        )
        return False

    success(f"{label} passed.")
    return True


def run_tests(root: Path) -> bool:
    """
    Try common project test commands.

    If no test command exists, report that testing is skipped.
    """

    package_json = root / "package.json"

    if package_json.exists():
        try:
            package = json.loads(
                package_json.read_text(
                    encoding="utf-8"
                )
            )

            scripts = package.get("scripts", {})

            if "test" in scripts:
                return run_command(
                    ["npm", "test"],
                    root,
                    "npm test",
                )

        except Exception:
            pass

    test_file = root / "pytest.ini"

    if test_file.exists():
        return run_command(
            ["python", "-m", "pytest"],
            root,
            "pytest",
        )

    warning(
        "No known test command found. "
        "Tests skipped."
    )

    return True


def run_build(root: Path) -> bool:

    package_json = root / "package.json"

    if not package_json.exists():
        warning(
            "package.json not found. "
            "Build skipped."
        )
        return True

    try:
        package = json.loads(
            package_json.read_text(
                encoding="utf-8"
            )
        )

        scripts = package.get("scripts", {})

        if "build" in scripts:
            return run_command(
                ["npm", "run", "build"],
                root,
                "npm run build",
            )

    except Exception:
        pass

    warning(
        "No npm build script found. "
        "Build skipped."
    )

    return True


# ============================================================
# HISTORY
# ============================================================

def load_history(root: Path) -> list[dict[str, Any]]:
    path = history_file(root)

    if not path.exists():
        return []

    try:
        return json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )
    except Exception:
        return []


def save_history(
    root: Path,
    history: list[dict[str, Any]],
) -> None:

    ensure_patchbay_dirs(root)

    history_file(root).write_text(
        json.dumps(
            history,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def record_history(
    root: Path,
    patch: dict[str, Any],
    status: str,
    snapshot: Path | None,
) -> None:

    history = load_history(root)

    history.append(
        {
            "patch_id": patch["id"],
            "name": patch["name"],
            "status": status,
            "timestamp": datetime.now().isoformat(),
            "snapshot": (
                str(snapshot)
                if snapshot
                else None
            ),
        }
    )

    save_history(root, history)


# ============================================================
# APPLY PATCH
# ============================================================

def apply_patch(
    root: Path,
    patch: dict[str, Any],
    dry_run: bool = False,
    force: bool = False,
    run_qa: bool = True,
) -> int:

    info(
        f"{TOOL_NAME} v{VERSION}"
    )

    info(
        f"Patch: {patch['id']} — "
        f"{patch['name']}"
    )

    analysis = analyze_patch(
        root,
        patch,
    )

    print()
    print("PATCH ANALYSIS")
    print("============================")
    print(f"Risk:           {analysis['risk']}")
    print(f"Files:          {len(analysis['files'])}")
    print(f"Lines added:    {analysis['total_added']}")
    print(f"Lines removed:  {analysis['total_removed']}")
    print()

    for item in analysis["files"]:
        protection = (
            "PROTECTED"
            if item["protected"]
            else "OK"
        )

        print(
            f"  {protection:10} "
            f"{item['file']} "
            f"(+{item['added']} "
            f"-{item['removed']})"
        )

    print()

    # Protected files
    protected_files = [
        item["file"]
        for item in analysis["files"]
        if item["protected"]
    ]

    if protected_files and not force:
        error(
            "Patch contains protected files:"
        )

        for path in protected_files:
            error(f"  {path}")

        error(
            "Use --force only if you "
            "explicitly understand the risk."
        )

        return 1

    # Show diffs
    print("DIFF")
    print("============================")

    for change in patch["changes"]:
        target = safe_project_path(
            root,
            change["file"],
        )

        diff = generate_diff(
            root,
            target,
            change["content"],
        )

        if diff:
            print(diff)

    if dry_run:
        success(
            "Dry run complete. "
            "No files were modified."
        )

        return 0

    # Git status
    if git_is_repository(root):
        status = git_status(root)

        if status:
            warning(
                "Git working tree contains "
                "existing changes."
            )

            print(status)

            if not force:
                error(
                    "Patch blocked to protect "
                    "existing work."
                )

                error(
                    "Use --force to continue."
                )

                return 1

    # Risk approval
    if analysis["risk"] in (
        "HIGH",
        "CRITICAL",
    ) and not force:

        print()
        warning(
            f"Patch risk is {analysis['risk']}."
        )

        answer = input(
            "Continue? Type 'YES': "
        )

        if answer != "YES":
            warning("Patch cancelled.")
            return 1

    # Snapshot
    snapshot = create_snapshot(
        root,
        patch,
    )

    success(
        f"Snapshot created: {snapshot.name}"
    )

    # Apply
    try:
        for change in patch["changes"]:
            target = safe_project_path(
                root,
                change["file"],
            )

            target.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            target.write_text(
                change["content"],
                encoding="utf-8",
            )

            success(
                f"Applied: {change['file']}"
            )

        # Optional QA
        if run_qa:
            print()
            print("QUALITY CHECK")
            print("============================")

            if not run_tests(root):
                raise RuntimeError(
                    "Tests failed."
                )

            if not run_build(root):
                raise RuntimeError(
                    "Build failed."
                )

        success(
            "Patch applied successfully."
        )

        record_history(
            root,
            patch,
            "success",
            snapshot,
        )

        return 0

    except Exception as exc:

        error(
            f"Patch failed: {exc}"
        )

        warning(
            "Starting automatic rollback..."
        )

        try:
            rollback_snapshot(
                root,
                snapshot,
            )

            record_history(
                root,
                patch,
                "rolled_back",
                snapshot,
            )

        except Exception as rollback_error:
            error(
                f"ROLLBACK FAILED: "
                f"{rollback_error}"
            )

            record_history(
                root,
                patch,
                "rollback_failed",
                snapshot,
            )

        return 1


# ============================================================
# DOCTOR
# ============================================================

def doctor(root: Path) -> int:

    print()
    print("🌲 HEARTWOOD DOCTOR")
    print("============================")

    print(
        f"Project root: {root}"
    )

    print()

    checks = []

    # Project
    checks.append(
        (
            "Project root",
            root.exists(),
        )
    )

    # Git
    checks.append(
        (
            "Git repository",
            git_is_repository(root),
        )
    )

    # Python
    checks.append(
        (
            "Python",
            sys.version_info >= (3, 10),
        )
    )

    # Patchbay
    try:
        ensure_patchbay_dirs(root)
        patchbay_ok = True
    except Exception:
        patchbay_ok = False

    checks.append(
        (
            "Patchbay storage",
            patchbay_ok,
        )
    )

    # package.json
    checks.append(
        (
            "package.json",
            (root / "package.json").exists(),
        )
    )

    for name, passed in checks:
        symbol = "✓" if passed else "✗"

        print(
            f"{symbol} {name}"
        )

    print()

    if all(passed for _, passed in checks):
        success(
            "Heartwood development environment "
            "looks healthy."
        )
        return 0

    warning(
        "Some checks need attention."
    )

    return 1


# ============================================================
# STATUS
# ============================================================

def show_status(root: Path) -> int:

    print()
    print("🌲 HEARTWOOD PATCH TOOL")
    print("============================")
    print(
        f"Version: {VERSION}"
    )
    print(
        f"Root:    {root}"
    )

    print()

    if git_is_repository(root):
        print("GIT")

        status = git_status(root)

        if status:
            print(status)
        else:
            print("✓ Working tree clean")

    else:
        print("⚠ Not a Git repository.")

    print()

    history = load_history(root)

    print(
        f"Patch history: {len(history)}"
    )

    if history:
        print()

        for item in history[-10:]:
            print(
                f"{item['timestamp']} "
                f"{item['patch_id']} "
                f"{item['status']}"
            )

    return 0


# ============================================================
# HISTORY COMMAND
# ============================================================

def show_history(root: Path) -> int:

    history = load_history(root)

    if not history:
        print("No patch history.")
        return 0

    print()
    print("PATCH HISTORY")
    print("============================")

    for item in history:
        print(
            f"{item['timestamp']}"
        )

        print(
            f"  ID:     {item['patch_id']}"
        )

        print(
            f"  Name:   {item['name']}"
        )

        print(
            f"  Status: {item['status']}"
        )

        if item.get("snapshot"):
            print(
                f"  Snapshot: "
                f"{item['snapshot']}"
            )

        print()

    return 0


# ============================================================
# HELPERS
# ============================================================

def sanitize_patch_id(value: str) -> str:
    safe = []

    for char in value:
        if (
            char.isalnum()
            or char in (
                "-",
                "_",
            )
        ):
            safe.append(char)

    result = "".join(safe)

    return result or "patch"


# ============================================================
# CLI
# ============================================================

def build_parser() -> argparse.ArgumentParser:

    parser = argparse.ArgumentParser(
        prog="heartwood-patch",
        description=(
            "Heartwood safe development "
            "patch tool."
        ),
    )

    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {VERSION}",
    )

    subparsers = parser.add_subparsers(
        dest="command"
    )

    # status
    subparsers.add_parser(
        "status",
        help="Show project status.",
    )

    # doctor
    subparsers.add_parser(
        "doctor",
        help="Check Heartwood environment.",
    )

    # history
    subparsers.add_parser(
        "history",
        help="Show patch history.",
    )

    # analyze
    analyze_parser = subparsers.add_parser(
        "analyze",
        help="Analyze a patch.",
    )

    analyze_parser.add_argument(
        "patch",
        type=Path,
    )

    analyze_parser.add_argument(
        "--json",
        action="store_true",
        help="Output JSON.",
    )

    # apply
    apply_parser = subparsers.add_parser(
        "apply",
        help="Apply a patch.",
    )

    apply_parser.add_argument(
        "patch",
        type=Path,
    )

    apply_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview without changing files.",
    )

    apply_parser.add_argument(
        "--force",
        action="store_true",
        help="Override safety confirmations.",
    )

    apply_parser.add_argument(
        "--no-qa",
        action="store_true",
        help="Skip tests and build.",
    )

    return parser


# ============================================================
# MAIN
# ============================================================

def main() -> int:

    parser = build_parser()

    args = parser.parse_args()

    root = find_project_root()

    try:

        if args.command == "status":
            return show_status(root)

        if args.command == "doctor":
            return doctor(root)

        if args.command == "history":
            return show_history(root)

        if args.command == "analyze":

            patch = load_patch_file(
                args.patch.resolve()
            )

            result = analyze_patch(
                root,
                patch,
            )

            if args.json:
                print(
                    json.dumps(
                        result,
                        indent=2,
                    )
                )
            else:
                print()
                print("PATCH ANALYSIS")
                print("============================")

                print(
                    f"ID:      {result['patch_id']}"
                )

                print(
                    f"Name:    {result['name']}"
                )

                print(
                    f"Risk:    {result['risk']}"
                )

                print(
                    f"Files:   {len(result['files'])}"
                )

                print(
                    f"Added:   {result['total_added']}"
                )

                print(
                    f"Removed: {result['total_removed']}"
                )

            return 0

        if args.command == "apply":

            patch = load_patch_file(
                args.patch.resolve()
            )

            return apply_patch(
                root,
                patch,
                dry_run=args.dry_run,
                force=args.force,
                run_qa=not args.no_qa,
            )

        parser.print_help()

        return 0

    except KeyboardInterrupt:
        warning("Cancelled by user.")
        return 130

    except Exception as exc:
        error(str(exc))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
