/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * paths.js - the single source of truth for every repo-relative path
 * the Patchbay cares about: where the game's data modules live, which
 * exported map each entity type is stored in, and which files are
 * off-limits or dangerous to touch automatically.
 *
 * All paths here are POSIX-style, repo-root-relative strings. The only
 * absolute path is PROJECT_ROOT, re-exported from the CodeChangeDeveloper
 * plugin's projectSandbox so the Patchbay and Spacemonkey's own code
 * writer can never disagree about where the repo root is.
 */

import { PROJECT_ROOT } from "../spacemonkey/plugins/CodeChangeDeveloper/skills/projectSandbox.js"

export { PROJECT_ROOT }

/**
 * Directory (repo-relative) holding the 12 hand-written Hearthwood data
 * ES modules. These are parsed, never imported - units.js does
 * `import img from "...jpg"` at the top, so `import()` from Node would
 * throw (R9 in the plan).
 */
export const HEARTHWOOD_DATA_DIR = "src/data/heartwood"

/**
 * Entity type -> { file, exportName }.
 *
 * `file` is the basename inside HEARTHWOOD_DATA_DIR. `exportName` is the
 * real `export const <NAME>` the entity map is bound to - every name
 * below was confirmed by opening the file on this branch:
 *
 *   enemies.js      export const ENEMIES        (object map)
 *   units.js        export const UNITS          (object map; = {...BASE_UNITS, ...TIER2_UNITS})
 *   cards.js        export const CARDS          (object map)
 *   relics.js       export const RELICS         (object map)
 *   items.js        export const ITEMS          (object map)
 *   characters.js   export const CHARACTERS     (object map)
 *   formations.js   export const FORMATIONS     (object map)
 *   synergies.js    export const SYNERGY_TIERS  (object map keyed by tribe id)
 *                     -- NOTE: no `SYNERGIES` export exists. synergies.js
 *                        also exports TRIBES / UNIT_TRIBES / helper fns.
 *                        SYNERGY_TIERS holds the editable per-tribe bonus
 *                        thresholds, which is the "synergy content".
 *   dualClasses.js  export const DUAL_CLASSES   (ARRAY, not a map)
 *   trials.js       export const TRIALS         (object map)
 *   tutorial.js     export const TUTORIAL_STEPS (ARRAY, not a map)
 *                     -- NOTE: no `TUTORIAL` export exists; the step list
 *                        is TUTORIAL_STEPS (tutorial.js also exports
 *                        TUTORIAL_SEEN_KEY, a string).
 *
 * Story/text round (Marc, 2026-09-19: "haluan pystyä muokkaamaan niin
 * tarinan, tekstit kuin jokasen unitin ja relicin" - units/relics were
 * already covered above; these 8 are the actual gap, all hand-authored
 * narrative/flavor text per docs/hearthwood-story-acts.md's own "story
 * is never generated" rule):
 *   cinematics.js   export const CINEMATICS               (object map - intro/ending cinematics)
 *   crossroads.js   export const ACT_CROSSROADS            (object map - per-Act story crossroads)
 *   crownless.js    export const CROWNLESS_INTRO_BY_TRIBE   (object map - the Crownless mirror-match intro lines)
 *   events.js       export const EVENTS                    (ARRAY - map-event vignettes + choices)
 *   merchant.js     export const MERCHANTS                 (object map - shopkeeper greeting lines)
 *   moods.js        export const FOREST_MOOD               (object map - Forest Mood band flavor text)
 *   boons.js        export const RUN_BOONS                 (ARRAY - run-modifier boon flavor+effects)
 *   boons.js        export const RUN_BANES                 (ARRAY - run-modifier bane flavor+effects;
 *                     same file as RUN_BOONS, a 2nd entity type pointing at it - the registry
 *                     keys on exportName, not file, so one file can back more than one type)
 *   storyLog.js     export const FLAG_LABELS                (object map, id -> plain string - the
 *                     Story Journal's own sentences, e.g. "You sealed the black wound in the
 *                     hollow tree." A FLAT map, not id -> object like every other type here;
 *                     hearthwood-read-entities.mjs exposes the bare string as a synthetic
 *                     `fields.text` so the editor can still treat it like any other scalar field.
 *                     Marc, 2026-09-19: "en löydä mistä voin muokkaa pelin tarinaa" - this was the
 *                     one genuinely-missing piece of narrative text after the cinematics/
 *                     crossroads/crownless/events round; help.js and coach.js were also
 *                     considered but are UI glossary/onboarding copy, not story.)
 */
export const ENTITY_TYPES = {
    enemies: { file: "enemies.js", exportName: "ENEMIES" },
    units: { file: "units.js", exportName: "UNITS" },
    cards: { file: "cards.js", exportName: "CARDS" },
    relics: { file: "relics.js", exportName: "RELICS" },
    items: { file: "items.js", exportName: "ITEMS" },
    characters: { file: "characters.js", exportName: "CHARACTERS" },
    formations: { file: "formations.js", exportName: "FORMATIONS" },
    synergies: { file: "synergies.js", exportName: "SYNERGY_TIERS" },
    dualClasses: { file: "dualClasses.js", exportName: "DUAL_CLASSES" },
    trials: { file: "trials.js", exportName: "TRIALS" },
    tutorial: { file: "tutorial.js", exportName: "TUTORIAL_STEPS" },
    cinematics: { file: "cinematics.js", exportName: "CINEMATICS" },
    crossroads: { file: "crossroads.js", exportName: "ACT_CROSSROADS" },
    crownless: { file: "crownless.js", exportName: "CROWNLESS_INTRO_BY_TRIBE" },
    events: { file: "events.js", exportName: "EVENTS" },
    merchants: { file: "merchant.js", exportName: "MERCHANTS" },
    moods: { file: "moods.js", exportName: "FOREST_MOOD" },
    boons: { file: "boons.js", exportName: "RUN_BOONS" },
    banes: { file: "boons.js", exportName: "RUN_BANES" },
    storyJournal: { file: "storyLog.js", exportName: "FLAG_LABELS" },
}

/**
 * Repo-relative path to a data file for a given entity type, or null if
 * the type is unknown.
 */
export function dataFilePathFor(type) {

    const entry = ENTITY_TYPES[type]

    if (!entry) {

        return null

    }

    return `${HEARTHWOOD_DATA_DIR}/${entry.file}`

}

/**
 * Directory (repo-relative) holding the Hearthwood battle/run engine.
 * Any edit under here that hits one of HEARTHWOOD_ENGINE_FILES is HIGH
 * risk - PR mode only.
 */
export const HEARTHWOOD_ENGINE_DIR = "src/services/heartwood"

/**
 * Engine module basenames (under HEARTHWOOD_ENGINE_DIR). Editing these is
 * game-logic work and stays Claude's job - the risk model forces PR mode.
 * runSaveState.js is deliberately NOT here: it is save-format, classified
 * CRITICAL via CRITICAL_FILES below.
 */
export const HEARTHWOOD_ENGINE_FILES = [
    "autoBattleEngine.js",
    "runEngine.js",
    "cardBattleEngine.js",
    "effects.js",
    "targeting.js",
    "runNarrative.js",
]

/** Repo-relative engine file paths (HEARTHWOOD_ENGINE_DIR + basename). */
export const HEARTHWOOD_ENGINE_PATHS = HEARTHWOOD_ENGINE_FILES.map(
    name => `${HEARTHWOOD_ENGINE_DIR}/${name}`,
)

/**
 * Save/serialization format. Touching this can silently break every
 * existing player's save, so it is CRITICAL (type-YES gated, PR only).
 */
export const SAVE_FORMAT_FILES = ["src/services/heartwood/runSaveState.js"]

/**
 * Hearthwood stylesheet(s). Marc tweaks the game's look through the
 * Patchbay ("hieroa UI" - colours, sizes), but `vite build` cannot catch
 * a visual regression, so any CSS edit is forced to at least MEDIUM
 * (preview + confirm) by the risk model. Listed here for later phases
 * (entity/target routing); the risk model matches `src/**` + `.css`
 * generally, not just this file.
 */
export const HEARTHWOOD_STYLE_FILES = ["src/components/heartwood/heartwood.css"]

/**
 * Files that must never be auto-applied. Any of these, or any path
 * outside src/** and .scratch/**, is CRITICAL.
 *
 * Only `vite.config.js` exists in this repo (no .ts / .mjs variant), so
 * the plan's "vite.config.*" is pinned to the real filename here.
 */
export const CRITICAL_FILES = [
    "src/services/heartwood/runSaveState.js",
    "vite.config.js",
    "scripts/stable-build-check.js",
    "server/prisma/schema.prisma",
    "package.json",
    "package-lock.json",
]

/**
 * Repo subtrees the Patchbay is allowed to write into at all. Anything
 * outside these is CRITICAL regardless of filename.
 */
export const ALLOWED_TREE_PREFIXES = ["src/", ".scratch/"]

/**
 * Field names whose values are arrays in the data modules. An edit whose
 * path passes through one of these (or through a numeric index) is at
 * least MEDIUM risk - array shape changes are riskier than a scalar bump.
 */
export const ARRAY_FIELD_NAMES = [
    "movePattern",
    "effects",
    "passives",
    "synergies",
    "traits",
    "tags",
]

/**
 * Known factory-call signatures used instead of a plain object literal
 * for a map entry - units.js: `unit(id, name, art, cost, role,
 * movePattern, opts = {})`, defined at units.js's own `function unit(...)`.
 * `positional` names the first N call arguments; `optsArgIndex` is the
 * trailing options-object argument's index, if present.
 *
 * Single source of truth for both scripts/hearthwood-read-entities.mjs
 * (extracts fields FROM a call) and scripts/hearthwood-apply-edit.mjs
 * (splices a value INTO a call's argument or its opts object) - they
 * must never independently drift on what "field X of a unit" means.
 */
export const FACTORY_SIGNATURES = {
    unit: {
        positional: ["id", "name", "art", "cost", "role", "movePattern"],
        optsArgIndex: 6,
    },
}
