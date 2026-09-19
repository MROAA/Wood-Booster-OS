/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * paths.js - the single source of truth for where Bloodmoor lives on
 * disk, which balance.js export each entity type maps to, and which
 * files are off-limits or dangerous to touch automatically.
 *
 * Unlike Hearthwood Patchbay, PROJECT_ROOT here is a genuinely separate
 * filesystem location - Bloodmoor is its own project, its own git
 * repository, outside Wood-Booster-OS entirely. This service (running
 * inside Wood-Booster-OS's Express process) reaches across to it
 * deliberately; nothing in Hearthwood Patchbay's own sandbox
 * (server/services/spacemonkey/plugins/CodeChangeDeveloper/skills/projectSandbox.js)
 * is touched or reused - see sandbox.js in this directory for Bloodmoor's
 * own, separate path-safety guard.
 */

export const PROJECT_ROOT = "/home/marc/Wood-Booster-AI/Bloodmoor"

/**
 * Entity type -> { file, exportName, kind }.
 *
 * `file` is repo-relative (from PROJECT_ROOT). `exportName` is the real
 * `export const <NAME>` in src/game/balance.js. `kind` tells the
 * read/apply scripts (tools/patchbay/*.mjs, inside Bloodmoor's own repo)
 * how to walk the export:
 *
 *   "map"    - an id-keyed object of many entities (WEAPONS only today).
 *   "single" - the export IS one entity (a flat settings object like
 *              BOSS) - everything else in balance.js is this shape.
 */
export const ENTITY_TYPES = {
    weapons: { file: "src/game/balance.js", exportName: "WEAPONS", kind: "map" },
    playerBase: { file: "src/game/balance.js", exportName: "PLAYER_BASE", kind: "single" },
    leveling: { file: "src/game/balance.js", exportName: "LEVELING", kind: "single" },
    weaponDropChance: { file: "src/game/balance.js", exportName: "WEAPON_DROP_CHANCE", kind: "single" },
    enemyBase: { file: "src/game/balance.js", exportName: "ENEMY_BASE", kind: "single" },
    elite: { file: "src/game/balance.js", exportName: "ELITE", kind: "single" },
    boss: { file: "src/game/balance.js", exportName: "BOSS", kind: "single" },
    spawner: { file: "src/game/balance.js", exportName: "SPAWNER", kind: "single" },
}

/**
 * Repo-relative path to a data file for a given entity type, or null if
 * the type is unknown.
 */
export function dataFilePathFor(type) {

    const entry = ENTITY_TYPES[type]

    return entry ? entry.file : null

}

/**
 * Engine module paths (repo-relative). Editing these through the
 * Patchbay is real game-code work, not a data tweak - the risk model
 * forces these to HIGH, same posture Hearthwood's own engine files get.
 * balance.js itself is deliberately NOT here - that's the one file this
 * tool exists to edit.
 */
export const ENGINE_FILES = [
    "src/main.js",
    "src/game/entities.js",
    "src/game/weapons.js",
    "src/game/spawner.js",
    "src/game/upgrades.js",
    "src/game/world.js",
    "src/game/input.js",
]

/**
 * Files that must never be auto-applied. Any of these, or any path
 * outside ALLOWED_TREE_PREFIXES, is CRITICAL.
 */
export const CRITICAL_FILES = [
    "package.json",
    "package-lock.json",
]

/** Repo subtrees the Patchbay is allowed to write into at all. */
export const ALLOWED_TREE_PREFIXES = ["src/"]

/**
 * Field names whose values are arrays in balance.js. An edit whose path
 * passes through one of these (or through a numeric index) is at least
 * MEDIUM risk. `ELITE.modifiers` is the one array field in Bloodmoor's
 * data today.
 */
export const ARRAY_FIELD_NAMES = ["modifiers"]
