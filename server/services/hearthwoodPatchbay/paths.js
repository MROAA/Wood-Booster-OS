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
 *                     `fields.value` so the editor can still treat it like any other scalar field.
 *                     Marc, 2026-09-19: "en löydä mistä voin muokkaa pelin tarinaa" - this was the
 *                     one genuinely-missing piece of narrative text after the cinematics/
 *                     crossroads/crownless/events round; help.js and coach.js were also
 *                     considered but are UI glossary/onboarding copy, not story.)
 *
 * Economy round (Marc, 2026-09-19: "dev studiossa pitää olla mukana myös
 * ekonomia... säädän itse sillä pelin vaikeustasoa" - the dev studio needs
 * the economy too, so he can adjust the game's own difficulty himself):
 * runEngine.js's tunable levers, extracted to economyLevers.js (a plain
 * data file - runEngine.js itself is HIGH risk, PR-mode-only, and PR mode
 * was never built) specifically so they could be registered here:
 *   economyLevers.js  export const ECONOMY_LEVERS   (object map - the 8
 *                       scalar levers: win/formation/miniboss/elite Essence
 *                       payouts, the Gamble's cost, and the 3 interest
 *                       levers - grouped into one map since this registry
 *                       only walks a single object-map/array export)
 *   economyLevers.js  export const SHOP_INVESTMENTS (object map - the
 *                       Ledger's 10 one-time buys, same shape/file this
 *                       registry already knew as runEngine.js's own export
 *                       before the move)
 *   economyLevers.js  export const MARKET_EVENTS    (object map - the 4
 *                       special-market defs, ditto)
 *
 * "Everything" round (Marc, 2026-09-20: "haluan pystyä muokkaamaan peliä
 * mahdollisimman vapaasti dev studiolla ja se pitää sisällään kaiken mitä
 * pelissä on" / "kaiken" - a full audit of every src/data/heartwood/*.js
 * file not yet registered, adding every one with genuine player-facing
 * text or tunable content; left OUT were files whose only exports are
 * pure internal logic/scoring with no real content to browse - battleAnalysis.js
 * (VERDICTS is just internal outcome tags), buildScore.js, playerPower.js,
 * playstyle.js, seed.js, threatPreview.js):
 *   economy.js     export const ECONOMY_ROLES     (object map - the 5
 *                    economy-crew archetypes, e.g. "Gambler")
 *   depths.js      export const DEPTHS            (ARRAY - the Ascension-
 *                    style challenge ladder: name/description + balance
 *                    fields like enemyMult/essenceDelta)
 *   almanac.js     export const ALMANAC_LORE       (object map, id -> a
 *                    long lore paragraph - a FLAT map like storyLog.js's
 *                    FLAG_LABELS, exposed via the same synthetic
 *                    `fields.value`)
 *   arenas.js      export const ARENAS             (ARRAY - battle arena
 *                    flavor + field effects)
 *   evolutions.js  export const EVOLUTIONS         (object map, unit id ->
 *                    its evolved form + unlock condition)
 *   roles.js       export const ROLES              (object map - the 9
 *                    unit archetype labels/icons/accents)
 *   upgrades.js    export const UPGRADE_BRANCHES   (ARRAY - the per-unit
 *                    upgrade choices' names/descriptions)
 *   help.js        export const HELP_SECTIONS      (ARRAY of {heading,
 *                    entries: [{term, blurb}]} - the in-run "?" glossary)
 *   coach.js       export const COACH_TIPS         (ARRAY - the new-player
 *                    contextual tooltip text)
 *   counterplay.js export const THREATS            (ARRAY - the "what to
 *                    bring" counterplay hints shown in threat previews)
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
    economyLevers: { file: "economyLevers.js", exportName: "ECONOMY_LEVERS" },
    investments: { file: "economyLevers.js", exportName: "SHOP_INVESTMENTS" },
    marketEvents: { file: "economyLevers.js", exportName: "MARKET_EVENTS" },
    economyRoles: { file: "economy.js", exportName: "ECONOMY_ROLES" },
    depths: { file: "depths.js", exportName: "DEPTHS" },
    almanac: { file: "almanac.js", exportName: "ALMANAC_LORE" },
    arenas: { file: "arenas.js", exportName: "ARENAS" },
    evolutions: { file: "evolutions.js", exportName: "EVOLUTIONS" },
    roles: { file: "roles.js", exportName: "ROLES" },
    upgradeBranches: { file: "upgrades.js", exportName: "UPGRADE_BRANCHES" },
    help: { file: "help.js", exportName: "HELP_SECTIONS" },
    coachTips: { file: "coach.js", exportName: "COACH_TIPS" },
    threats: { file: "counterplay.js", exportName: "THREATS" },
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
