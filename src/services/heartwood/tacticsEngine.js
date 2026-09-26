// Hearthwood Frontier (feat/hearthwood-tactics-prototype) - Phase 1 of the
// turn-based pivot Marc chose over the shipping auto-battler ("uusi moottori
// korvaa vanhan"). Fully isolated: no import from autoBattleEngine.js,
// effects.js, or runEngine.js, no localStorage, no save state. The one thing
// it shares with the live game is DATA - real UNITS/ENEMIES defs, read-only,
// converted into a turn-based shape ("kaytetaan olemassaolevia mekaniikkoja
// ja muutetaan tarvittavat uuteen muottiin" - use the existing mechanics,
// convert what needs it into the new mold) rather than hand-authored
// placeholder numbers.
//
// Same "state in, state out" discipline as autoBattleEngine.js: every
// function takes a TacticsState and returns a new one via { ...state, ... },
// nothing here mutates its argument.
//
// TacticsState = {
//   grid: { rows, cols },
//   units: [{ id, side: "player"|"enemy", defId, name, art, image,
//              pos: {row, col}, hp, maxHp, move, range, attack,
//              ap, apMax, block, ability: {id,name,cost,kind,cooldown,...}|null,
//              cooldownRemaining }],
//   phase: "player" | "enemy" | "won" | "lost",
//   turn: number,
//   log: string[],
//   formationId: "default" | "swarm" | "fortress",
// }

import { UNITS } from "../../data/heartwood/units"
import { ENEMIES } from "../../data/heartwood/enemies"
import { CHARACTERS, commanderPassiveWithRank } from "../../data/heartwood/characters"
import { isOnBoard, samePos, kingAdjacent, reachableTiles as reachableTilesRaw } from "./targeting"
import * as relicFx from "./tacticsRelics"
import { objectiveVerdict, objectiveEnemyPhaseStart, objectiveNewTurn } from "./tacticsObjectives"
import { deriveAbilityForDef, abilityTargetSide } from "./tacticsAbilities"
import { enemySkillsFor, ENEMY_SKILL_KINDS } from "./tacticsEnemyAbilities"
export { abilityTargetSide, describeAbility, abilityHint } from "./tacticsAbilities"

// Marc: "taistelukenttä saa olla isompi" - the battlefield can be bigger.
// Doubled the tile count (35 -> 70) for real maneuvering room; every
// formation's row spread below is re-centered on the taller grid.
//
// Grown again (Movement PRD's Facing + Zone of Control both reward
// getting to an enemy's side/back, which needs room to route around
// it): 70 -> 108 tiles. Every ENEMY_FORMATIONS entry's row spread is
// now computed generically via spreadRows(count, GRID.rows) instead of
// a hardcoded per-formation array (see createTacticsBattle) - no
// per-formation re-centering needed this time or any future resize.
export const GRID = { rows: 9, cols: 12 }

// Terrain (Hearthwood Frontier, feat/hearthwood-tactics-terrain): this
// game has never had a per-cell battlefield property before (confirmed
// absent, not overlooked - the real game's own "Arena" system,
// arenas.js, is a genuine precedent for "battles vary via data," but a
// whole-battle flat buff/debuff, a different granularity entirely from
// a per-cell one). No real source-of-truth terrain data exists to port,
// so this reuses Marc's OWN illustrative numbers from his Movement PRD's
// own §3.2 JSON example (forest:1, rock:3, water: effectively
// impassable) rather than inventing fresh ones - `cost` feeds
// reachableTiles's own weighted pathfinding (targeting.js), `Infinity`
// meaning "never enters, no matter the route." `grantPoison` (Poison
// Ground) reuses the Rot archetype's own real per-application amount
// (rotgut-crawler's +2) and the EXISTING poison/applyPoisonTick fields
// wholesale - a hazard tile needs zero new damage-over-time machinery.
const TERRAIN = {
  path: { cost: 1 },
  forest: { cost: 1 },
  rock: { cost: 3 },
  water: { cost: Infinity },
  poison: { cost: 1, grantPoison: 2 },
}

// A formation's own optional `terrain` map (`{"row-col": "rock", ...}`)
// read straight off `state.terrain` - an omitted cell (every EXISTING
// formation, none of which carry a `terrain` field at all) defaults to
// `"path"`, keeping every pre-terrain formation's behavior byte-
// identical to before this round. `state.terrain` itself is also
// defensively defaulted to `{}` - a REAL bug caught by this round's own
// verify run: many EXISTING hand-built synthetic states across every
// prior round's own checks predate `terrain` entirely and never set the
// field at all, which crashed here on first run (`undefined["1-0"]`)
// before this guard was added.
function terrainAt(state, pos) {
  return (state.terrain || {})[`${pos.row}-${pos.col}`] || "path"
}

// Phase 2 ("jatketaan" -> "AP + one real ability per unit"). Every unit now
// spends a shared Action Point budget instead of the old free "one move +
// one attack" pair - apMax 2, the PRD's own example number. Move/Attack/
// Ability each cost AP, so a unit does at most two of those per turn - the
// first genuine "what do I spend this on" decision, which is the whole
// point of the pivot.
const AP_MAX = 2

// The 3 player abilities, converted from each unit's REAL existing kit
// (Marc: "kaytetaan olemassaolevia mekaniikkoja ja muutetaan tarvittavat
// uuteen muottiin") rather than invented from nothing:
//  - bulwark-of-ages already has `aura: { effect: { type:"block", amount:2 } }`
//    (autoBattleEngine.js's applyAuraTick) -> Bulwark Aura grants Block to
//    itself + adjacent allies.
//  - the-fool already has `passive: [{ applyBuff regen 2 }]` -> Regrowth
//    heals itself or an adjacent ally.
//  - hexbreaker is a plain attacker whose real identity is reach ->
//    Focused Shot is a costly (its whole turn), high-damage single hit.
// Enemies get no ability this round (`ability: null`) - no scope creep.
//
// `cooldown` (added this round) - how many of the unit's OWN turns must
// pass after a cast before it's usable again. Ticks down once per player
// turn (see runEnemyTurn's player-phase-return reset), so `cooldown: 2`
// reads as "usable every OTHER turn" - cast on turn N, still cooling on
// N+1, ready again on N+2. Focused Shot (the biggest single payoff) gets
// the longest wait.
// Roster-expansion round ("jatketaan" -> expand the player roster, a
// sidebar squad picker mirroring "Choose your opponent"): 3 more units,
// each chosen because its real kit maps cleanly onto one of the 3 EXISTING
// ability kinds above - no new engine capability needed this round, same
// "convert what needs it into the new mold" discipline as every archetype
// round:
//  - oathshield's real `aura: { effect: { type:"block", amount:1 } }` ->
//    Shieldwall, a lighter Bulwark Aura (amount 1 instead of 2) - a second
//    tank option. Its real `guard` passive isn't ported (no threat-
//    redirect/targeting system exists here) - a named simplification.
//  - willowmend's real movePattern [cleanse, heal 4, attack 4] -> Mending
//    Waters, a second Regrowth-shaped heal at the real amount (4 instead
//    of Regrowth's 5) - a second healer option. The real `cleanse` step
//    isn't ported (no debuff-strip mechanic exists anywhere in this
//    engine yet - the same gap Rot's missing cleanse-answer already
//    named).
//  - bramble-sweep's real `attackPattern: "rook"` -> Ripple Strike, a
//    second Focused-Shot-shaped burst (identical cost/multiplier/
//    cooldown) - a straight-line-reach attacker alongside Hexbreaker's
//    diagonal one, a second real DPS flavor.
// All 3 ability NAMES (Shieldwall/Mending Waters/Ripple Strike) are
// invented, consistent with Phase 2's own precedent (Bulwark Aura/
// Regrowth/Focused Shot are ALSO invented - the real auto-battler has no
// player-triggered "abilities" at all). The units' real names/art/HP/
// attack numbers are all reused as-is from units.js, never invented.
const ABILITIES = {
  "bulwark-of-ages": { id: "aura-block", name: "Bulwark Aura", cost: 1, kind: "aura-block", amount: 2, cooldown: 2 },
  "the-fool": { id: "regrowth", name: "Regrowth", cost: 1, kind: "heal", amount: 5, cooldown: 2 },
  hexbreaker: { id: "focused-shot", name: "Focused Shot", cost: 2, kind: "burst", multiplier: 2, cooldown: 3 },
  oathshield: { id: "shieldwall", name: "Shieldwall", cost: 1, kind: "aura-block", amount: 1, cooldown: 2 },
  willowmend: { id: "mending-waters", name: "Mending Waters", cost: 1, kind: "heal", amount: 4, cooldown: 2 },
  "bramble-sweep": { id: "ripple-strike", name: "Ripple Strike", cost: 2, kind: "burst", multiplier: 2, cooldown: 3 },
}

// The player roster (real names/art/HP; move/range/attack are DERIVED below
// from the unit's actual movePattern/attackPattern, not invented). Player
// always starts at the right edge (col GRID.cols-1), rows centered by
// spreadRows below - unaffected by which enemy formation is chosen.
// Commander round (feat/hearthwood-tactics-squad6, corrected mid-round from
// "6 units" to Marc's actual "5, 4+commander"): grown from 3 to 4 recruited
// defaults - "oathshield" is real, existing roster content, not new.
const PLAYER_DEF_IDS = ["bulwark-of-ages", "the-fool", "hexbreaker", "oathshield"]
// The full 6-unit pool the sidebar squad picker offers - PLAYER_DEF_IDS
// (now 4 recruited defaults) plus 2 more swappable alternatives from a
// later roster-expansion round.
// Spirit Shift round: beastcaller (real units.js content, the
// Frontier's Spiritwalker) joins as a 7th option - no ability of its
// own, its whole identity is the Spirit Wolf it brings and the swap.
export const PLAYER_ROSTER_IDS = [...PLAYER_DEF_IDS, "willowmend", "bramble-sweep", "beastcaller"]

// The Commander (real 5th unit in the auto-battler, characters.js/
// autoBattleEngine.js's own COMMANDER_POSITION) - deployed ALONGSIDE the 4
// recruited units, not replacing one of them, matching Marc's own
// "4+commander" phrasing. Only basic combat stats participate this round
// (Marc: "Just make the Commander participate") - Haste and Squad Passive
// are named, deliberate deferrals for future rounds.
const DEFAULT_COMMANDER_ID = "tommy"

// Phase 3's first slice ("jatketaan" -> "1-2 more enemy archetypes"): two
// of the 9 shipped auto-battler archetypes, ported with their REAL ids/HP/
// attack/synergy numbers (read directly from formations.js/enemies.js, not
// guessed) rather than invented ones - the same "kaytetaan olemassaolevia
// mekaniikkoja" discipline as every prior Frontier round.
//  - swarm ("the-brood", formations.js) - 4 bodies, synergy "Strength in
//    numbers" = a FLAT, ONE-TIME +1 Strength to every piece at battle
//    start (explicitly not a per-round ramp in the shipped mechanic - a
//    compounding version was found archetype-hostile and flattened).
//    Outnumbers the player 4-to-3, the archetype's whole identity.
//  - fortress ("the-bulwark", formations.js) - 3 very tough bodies,
//    synergy "The wall holds firm" = a flat +3 Block every round (granted
//    at the start of each enemy phase - see endPlayerTurn - so it's live
//    to absorb the player's NEXT attacks; Block already resets to 0 for
//    every other reason in this engine, so a flat overwrite each enemy
//    phase already IS "resets then re-applies", matching the real
//    mechanic with no extra reset step needed).
// Known simplification: Mossmender's real kit also self-heals - enemy
// abilities are still out of scope (Phase 2's call), so that part of the
// archetype isn't reproduced yet. Its HP/Block carry over faithfully.
export const ENEMY_FORMATIONS = {
  default: {
    id: "default",
    name: "The Frontier Test Squad",
    description: "The roster this Frontier opened with - a wall, a claw, and a hoard.",
    enemyDefIds: ["ironmaw", "sapling-attendant", "hoardling"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  swarm: {
    id: "swarm",
    name: "The Brood",
    description: "Not one thing to fight. A dozen small ones, and every one of them is still a mouth.",
    enemyDefIds: ["sporelet", "mire-gnat", "sporelet", "mire-gnat"],
    battleStartBonus: 1,
    fortressBlock: 0,
    selfMend: 0,
  },
  fortress: {
    id: "fortress",
    name: "The Bulwark",
    description: "Two wardens shoulder to shoulder, and a mender behind them stitching every crack shut before you can widen it.",
    enemyDefIds: ["oakshell-warden", "oakshell-warden", "mossmender"],
    battleStartBonus: 0,
    fortressBlock: 3,
    selfMend: 0,
  },
  hunters: {
    id: "hunters",
    name: "The Pack",
    description: "Three of them, low and fast, already circling the one of you that looks tired.",
    enemyDefIds: ["fen-stalker", "pack-runner", "fen-stalker"],
    battleStartBonus: 2,
    fortressBlock: 0,
    selfMend: 0,
  },
  ancients: {
    id: "ancients",
    name: "The Ancient Grove",
    description: "Two small things moving fast, and behind them one that has not moved yet, and is about to.",
    enemyDefIds: ["sapling-attendant", "ancient-oak", "sapling-attendant"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  coven: {
    id: "coven",
    name: "The Conclave",
    description: "Two of them stand ready, and behind them a third that only ever moves its lips.",
    enemyDefIds: ["bog-devotee", "hex-acolyte", "coven-matron"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  cult: {
    id: "cult",
    name: "The Communion",
    description: "Two kneeling, one counting. In two breaths there will be one kneeling, and the other two will be worse.",
    enemyDefIds: ["sworn-cultist", "sworn-cultist", "ritual-warden"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  brood: {
    id: "brood",
    name: "The Clutch",
    description: "Three of them, swollen and still. Break one open and see what spills out.",
    enemyDefIds: ["brood-mother", "brood-mother", "brood-mother"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  rot: {
    id: "rot",
    name: "The Blight",
    description: "Three of them, low to the ground, and the ground going soft and black behind them.",
    enemyDefIds: ["rotgut-crawler", "spore-lurcher", "rotgut-crawler"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 1,
  },
  collectors: {
    id: "collectors",
    name: "The Tithe",
    description: "Two quick hands and one patient one. They will leave with more than they came with.",
    enemyDefIds: ["hoardling", "tithe-warden", "hoardling"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  // The first SOLO formation - one body, not a 2-4-piece pack. Deepwarden's
  // real identity (a passive Strength buff + an HP-gated phase that adds a
  // repeating turnStart Block trigger) is exactly what this round's new
  // passive/phases/trigger reading in deriveTacticsUnit/checkEnemyPhase/
  // applyTurnStartTriggers exists to demonstrate - description is the
  // real enemies.js introLine, reused verbatim.
  deepwarden: {
    id: "deepwarden",
    name: "Deepwarden",
    description: "It has been standing here since before you knew the Hearthwood existed. It isn't moving.",
    enemyDefIds: ["deepwarden"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  // This round's demo for the new onDealDamage trigger firing - The
  // Gorging Maw's entire real identity is its lifelink (heals 4 on every
  // landed hit), which needed that trigger type to exist at all.
  "the-gorging-maw": {
    id: "the-gorging-maw",
    name: "The Gorging Maw",
    description: "Every wound it opens on you, it closes one of its own. Don't let this go long.",
    enemyDefIds: ["the-gorging-maw"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  // This round's demo for the new modifiedAttackAmount damage-modifier
  // pipeline - Wyrmgall's entire real identity is Execute+Shatter, both
  // bonus-damage stacks, no strength folded in (an explicit contrast to
  // Deepwarden/Ironmaw's strength-heavy passives).
  wyrmgall: {
    id: "wyrmgall",
    name: "Wyrmgall",
    description: "It isn't watching your squad. It's watching for the mistake your squad hasn't made yet.",
    enemyDefIds: ["wyrmgall"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  // Thorn Zone round: rootbind-thicket is a plain Act 2 mook, not an
  // elite/miniboss/boss, but it needs the exact same solo-demo
  // accommodation every mechanic-carrying enemy above already gets -
  // its own new Root mechanic can't be demoed from inside a 3-enemy
  // formation any more than Wyrmgall's own AoE could.
  "rootbind-thicket": {
    id: "rootbind-thicket",
    name: "Rootbind Thicket",
    description: "Its roots don't reach far. When they catch you, though, you don't move.",
    enemyDefIds: ["rootbind-thicket"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  // This round's demo for the new persistent Bulwark mechanic - The Iron
  // Sentinel's entire real identity is its compounding armour, granted
  // entirely via a turnStart trigger (not a base passive stat), so it
  // also doubles as a proof that PR #464's trigger firing correctly
  // reaches a brand-new portable effect id.
  "the-iron-sentinel": {
    id: "the-iron-sentinel",
    name: "The Iron Sentinel",
    description: "Its armour thickens every round it stands. A slow grind loses this one - open big or execute.",
    enemyDefIds: ["the-iron-sentinel"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  // This round's demo for the new Regen + Taunt mechanics - Thornmaw's
  // entire real identity is "the squad can't just ignore it OR grind
  // through its Block-less HP pool," which needs both pieces together.
  thornmaw: {
    id: "thornmaw",
    name: "Thornmaw",
    description: "It doesn't raise its guard. It doesn't need to - it's already healed from worse than you.",
    enemyDefIds: ["thornmaw"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  // This round's demo for the new Revive + AoE mechanics - the run's
  // final boss, the one fight in the game where "hide the squad behind
  // one tank" and "trade hits until it dies" both stop being guaranteed
  // answers.
  spacemonkey: {
    id: "spacemonkey",
    name: "Spacemonkey",
    description: "\"You made it further than I expected.\" He doesn't sound worried. He sounds curious.",
    enemyDefIds: ["spacemonkey"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  // This round's demo for the new terrain + movement-cost mechanics -
  // ironmaw (real HP 46, already used in "default") is reused as-is
  // rather than inventing a new enemy; the point of this formation is
  // the BATTLEFIELD itself, not its occupant. A rock wall spans column 5
  // (rows 1/2/4/5), leaving row 3 open as a poisoned shortcut straight
  // across and rows 0/6 open as a longer but safe detour - a genuine
  // route decision, not cosmetic tiles. A single water tile sits right
  // in front of the enemy, forcing one final side-step on arrival.
  "the-crossing": {
    id: "the-crossing",
    name: "The Crossing",
    description: "One straight path across, already poisoned. The long way around is still open, if there's time for it.",
    enemyDefIds: ["ironmaw"],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
    // Re-centered for the 9x12 grid (was 7x10): the wall still flanks
    // the enemy's own centre row immediately above/below, the poisoned
    // shortcut still runs straight through the centre, and the water
    // tile still sits 2 tiles in front of the enemy's own spawn -
    // same puzzle shape, just recomputed for the taller/wider board.
    terrain: {
      "2-6": "rock",
      "3-6": "rock",
      "5-6": "rock",
      "6-6": "rock",
      "4-6": "poison",
      "4-2": "water",
    },
  },
}

// Reads the def's own already-authored movePattern for its attack amount
// (averaged if it swings more than once) - the same numbers the auto-
// battler already uses, not a fresh guess. A pure-support kit with no
// attack step (rare) falls back to a token 3.
function attackFromMovePattern(movePattern) {
  const steps = (movePattern || []).filter((m) => m.type === "attack")
  if (!steps.length) return 3
  return Math.round(steps.reduce((sum, m) => sum + (m.amount || 0), 0) / steps.length)
}

// The Rot archetype's real numbers, summed from the def's own already-
// authored `debuff poison` movePattern steps - the same "read the def's
// own data" discipline attackFromMovePattern already uses for `attack`,
// summed rather than averaged since poison stacks accumulate additively
// in the real game too (effects.js's applyBuff is a plain `+=`, never a
// set). 0 for every enemy that carries no such step - confirmed by
// reading every currently-used enemy def directly, none of them do.
function poisonFromMovePattern(movePattern) {
  const steps = (movePattern || []).filter((m) => m.type === "debuff" && m.id === "poison")
  return steps.reduce((sum, m) => sum + (m.amount || 0), 0)
}

// Boss/elite phases round: a generic reader for a real def's own
// `passive` array (autoBattleEngine.js's battle-start passive loop,
// read directly - not reinvented). This engine has never modeled the
// status ids ward/bulwark/taunt/regen/shatter/execute/revive/
// woundedFury, so an `applyBuff` entry with one of those ids is simply
// not interpreted here (a named, stated deferral - not a silent bug,
// same discipline as every archetype round's "not ported" list). Only
// `strength` is portable, since it maps directly onto this engine's own
// attack-as-Strength model (the exact translation battleStartBonus/
// Coven/Ancients already use). `addTrigger` entries are collected as-is
// for the unit's own `triggers` array, fired later (see
// applyTurnStartTriggers below) - only `turnStart` is ever fired off an
// ENEMY's own passive this round; no currently-ported enemy needs an
// onDealDamage trigger from ITS OWN passive (Squad Passive round: the
// PLAYER side now fires real onDealDamage triggers too, via a
// completely separate path - applySquadPassiveToUnits, not this
// function - since that comes from the Commander, not each unit's own
// def).
// Generalized from passiveStrengthFromDef (PR #464, strength-only) to
// also fold Wyrmgall's real execute/shatter and the final boss's real
// woundedFury straight off each unit's own base passive - the exact same
// "sum this id's own applyBuff entries at derive time" discipline,
// applied to 3 more ids. `weak` is deliberately NOT summed here - it
// never appears in any unit's own base passive, only ever arriving via a
// fired effect (e.g. a future onDealDamage trigger targeting the OTHER
// party in a hit), so it always starts at a plain 0.
function passiveStatsFromDef(passive) {
  const stats = { strength: 0, execute: 0, shatter: 0, woundedFury: 0, taunt: 0, revive: 0 }
  for (const p of passive || []) {
    if (p.type === "applyBuff" && p.id in stats) stats[p.id] += p.amount || 0
  }
  return stats
}

// Spacemonkey's real AoE (autoBattleEngine.js's own moveSelect:
// "weightedRandom"): for an enemy carrying an `aoe`-type movePattern
// step, returns {amount, chance} - chance is the aoe step's own real
// weight divided by the pattern's real total weight, computed from the
// actual numbers (never hand-picked), so the frequency this engine
// reproduces is exactly the real one. null for every other enemy
// (nothing currently ported has an aoe step but Spacemonkey).
function aoeMoveFromDef(def) {
  if (def.moveSelect !== "weightedRandom" || !def.movePattern) return null
  const aoeStep = def.movePattern.find((m) => m.type === "aoe")
  if (!aoeStep) return null
  const totalWeight = def.movePattern.reduce((sum, m) => sum + (m.weight || 1), 0)
  return { amount: aoeStep.amount, chance: (aoeStep.weight || 1) / totalWeight }
}

// This engine has been 100% deterministic since Phase 1 (no Math.random
// anywhere) - both for reproducibility and because the player-facing
// enemy-intent telegraph (previewEnemyIntents, PR #450) depends on a
// preview computed during the player's own turn always matching what
// actually happens once they end it. The real game's own
// moveSelect:"weightedRandom" is a true per-decision Math.random() coin
// flip, which would break that guarantee outright. Deriving the roll
// from the state's own `turn` number instead (a small stable hash, never
// Math.random) keeps both properties: nothing changes `turn` between a
// preview shown during the player's turn and the real resolution that
// follows it, so both calls see the same input and make the same
// decision - telegraph honesty by construction, not by luck.
// Sidestep round: exported so verify checks can recompute the exact
// expected roll for a chosen `turn` value instead of guessing one.
export function deterministicRoll(turn, seedText) {
  let h = Math.imul(turn, 2654435761) >>> 0
  for (let i = 0; i < seedText.length; i++) h = Math.imul(h ^ seedText.charCodeAt(i), 2654435761) >>> 0
  h = (h ^ (h >>> 15)) >>> 0
  return (h % 10000) / 10000
}

function triggersFromPassive(passive) {
  return (passive || []).filter((p) => p.type === "addTrigger").map((p) => ({ trigger: p.trigger, effect: p.effect }))
}

// The shared interpreter for a portable effect - used by a fired phase's
// own `effects` array, a `turnStart` trigger's single `effect`, and (this
// round) an `onDealDamage` trigger's own effect. Recognizes: applyBuff
// strength (-> this engine's own attack-as-Strength model, unchanged),
// applyBuff execute/shatter/woundedFury/weak (a plain `unit[id] +=
// amount` - Wyrmgall's real escalating Execute, the final boss's real
// WoundedFury, and a future Weak-on-target debuff all read this way),
// block (an immediate/repeating grant, the same shape Fortress's
// fortressBlock already uses), and heal (capped at maxHp). Anything else
// - an unrecognized applyBuff id, any other effect type - is a
// deliberate no-op, matching the named-deferred list above.
function applyPortableEffect(state, unitId, effect) {
  const unit = getUnit(state, unitId)
  if (!unit || unit.hp <= 0) return state
  if (effect.type === "applyBuff" && effect.id === "strength") {
    return setUnit(state, unitId, { attack: unit.attack + (effect.amount || 0) })
  }
  // Active Power round: ward/vulnerable join the list - 4 of the 7 real
  // Commander Active Powers (Brace/Stonewall/Grovecall's Ward,
  // Blightcall's Vulnerable) need them. No enemy passive/phase/trigger
  // routes either id through here today (Deepwarden's own passive Ward
  // goes through passiveStatsFromDef, which still ignores it), so this
  // changes nothing about any existing fight.
  if (effect.type === "applyBuff" && ["execute", "shatter", "woundedFury", "weak", "bulwark", "regen", "taunt", "ward", "vulnerable"].includes(effect.id)) {
    return setUnit(state, unitId, { [effect.id]: (unit[effect.id] || 0) + (effect.amount || 0) })
  }
  if (effect.type === "block") {
    return setUnit(state, unitId, { block: unit.block + (effect.amount || 0) })
  }
  if (effect.type === "heal") {
    return setUnit(state, unitId, { hp: Math.min(unit.maxHp, unit.hp + (effect.amount || 0)) })
  }
  // Relic/item effects (poison/burn/stun/sunder/cleanse...): tacticsRelics.js.
  const patch = relicFx.relicEffectPatch(unit, effect)
  return patch ? setUnit(state, unitId, patch) : state
}

// Squad Passive round: the Commander's real squadPassive
// (characters.js) - applied ONCE at battle start to EVERY deployed
// player unit (the Commander included), the exact self-targeting loop
// autoBattleEngine.js's own startAutoBattle already uses (`for (const u
// of playerUnits) { applyEffects(state, squadPassive, {actorId:u.id,
// targetId:u.id}) }`). Reuses this engine's own existing
// applyPortableEffect/addTrigger dispatch - the exact shape
// checkEnemyPhase's own effect-application loop already uses for a
// fired phase's effects - rather than importing effects.js's
// applyEffects (isolation principle intact). Operates on a bare units
// array (not a full battle state) since applyPortableEffect/getUnit/
// setUnit only ever read/write `state.units` - a minimal `{ units }`
// wrapper is a real, safe substitute, confirmed by reading those 2
// helpers directly, not a workaround.
function applySquadPassiveToUnits(units, squadPassive) {
  let state = { units }
  for (const unit of units) {
    if (unit.side !== "player") continue
    for (const effect of squadPassive) {
      state =
        effect.type === "addTrigger"
          ? setUnit(state, unit.id, { triggers: [...getUnit(state, unit.id).triggers, { trigger: effect.trigger, effect: effect.effect }] })
          : applyPortableEffect(state, unit.id, effect)
    }
  }
  return state.units
}

// A pattern attacker (rook/bishop/knight - the auto-battler's existing
// "hits past the front line" mechanic) converts into "has real reach" here;
// everyone else is melee range 1. The exact number (3) is a placeholder
// conversion rule for this prototype, not a final one - Phase 3 (wiring the
// real roster in) is where this gets a considered pass.
function rangeFromAttackPattern(attackPattern) {
  return attackPattern && attackPattern !== "single" ? 3 : 1
}

// No `move` stat exists anywhere in the live data (there is no movement in
// an auto-battle) - this is the one genuinely new number Phase 1 adds, and
// it's still derived from an existing signal (how tanky the piece is)
// rather than picked per-unit by hand: heavier bodies plant themselves,
// lighter ones cover ground.
function moveFromMaxHp(maxHp) {
  return maxHp >= 40 ? 2 : 3
}

// `uid` is an explicit, caller-supplied unique id - required now that a
// formation can repeat a defId (the Swarm fields 2 Sporelets, the
// Fortress fields 2 Oakshell Wardens); deriving an id from `defId` alone
// would collide two enemies onto the same id and corrupt every id-keyed
// lookup (getUnit/setUnit, React key/layoutId).
function deriveTacticsUnit(defId, side, pos, uid, overrideDef = null) {
  const def = overrideDef || (side === "enemy" ? ENEMIES[defId] : UNITS[defId])
  const maxHp = def.maxHp
  // The Ancients archetype's real def already carries `charge` - reused
  // directly (see ENEMY_FORMATIONS's comment), never reinvented. The
  // Coven's real def carries `covenAura` the same way; the Cult's real
  // def carries `cultRitual`/`cultFodder`.
  const charge = side === "enemy" ? def.charge || null : null
  const covenAura = side === "enemy" ? def.covenAura || null : null
  const cultRitual = side === "enemy" ? def.cultRitual || null : null
  const cultFodder = side === "enemy" ? !!def.cultFodder : false
  const broodSplit = side === "enemy" ? def.broodSplit || null : null
  const poisonOnHit = side === "enemy" ? poisonFromMovePattern(def.movePattern) : 0
  const leech = side === "enemy" ? !!def.leech : false
  // Haste round: units.js's/characters.js's own real `haste` field - a
  // portable trait exactly like leech/cultFodder above, just gated the
  // other way (player-only, matching the real mechanic's own `side ===
  // "player"` restriction in autoBattleEngine.js - no enemy in the game
  // currently sets it). Read straight off `def`, not hand-coded per
  // character - 3 real recruited units (swiftclaw/willowfang/ashmaw)
  // already have it too, even though none are in the current roster.
  const haste = side === "player" ? !!def.haste : false
  // Boss/elite phases round: the def's own real `passive`/`phases`
  // arrays, read directly (enemy side only, matching every prior
  // archetype field's own precedent). A unit's portable passive Strength
  // (e.g. Ironmaw's/Deepwarden's real +3) is folded straight into its
  // starting `attack` here - the exact same "battle-start, no growth
  // badge" treatment createTacticsBattle's own battleStartBonus already
  // gets, since this is a real innate trait, not an earned buff.
  const passiveStats = side === "enemy" ? passiveStatsFromDef(def.passive) : { strength: 0, execute: 0, shatter: 0, woundedFury: 0, taunt: 0, revive: 0 }
  const triggers = side === "enemy" ? triggersFromPassive(def.passive) : []
  const phases = side === "enemy" ? def.phases || [] : []
  return {
    id: uid,
    side,
    defId,
    name: def.name,
    art: def.art,
    image: def.image || null,
    pos,
    hp: maxHp,
    maxHp,
    move: moveFromMaxHp(maxHp),
    range: rangeFromAttackPattern(def.attackPattern),
    attack: attackFromMovePattern(def.movePattern) + passiveStats.strength,
    ap: AP_MAX,
    apMax: AP_MAX,
    block: 0,
    // Abilities sprint: every other deployable unit derives one from its
    // own kit (tacticsAbilities.js); the Commander (overrideDef) gets none.
    ability: side === "player" ? ABILITIES[defId] || (overrideDef ? null : deriveAbilityForDef(def)) : null,
    cooldownRemaining: 0,
    charge,
    chargeCounter: charge ? charge.turns : 0,
    chargeHpMark: maxHp,
    covenAura,
    cultRitual,
    cultFodder,
    ritualCharge: 0,
    broodSplit,
    broodGen: 0,
    poison: 0,
    poisonOnHit,
    leech,
    haste,
    // Facing round (Marc's own Movement & Tactical Gameplay PRD §4.2):
    // every unit starts facing the opposing side - players always
    // deploy at col: GRID.cols-1 facing "W" (toward the enemy side at
    // col 0), enemies always deploy at col 0 facing "E" - a real,
    // universal default confirmed true for every formation/real
    // matchup this engine builds, not a per-formation special case.
    // Updated by moveUnit whenever the unit actually moves; attacking
    // in place never turns a unit around.
    facing: side === "player" ? "W" : "E",
    // Per-class Facing round: reads whatever units.js's own className
    // field holds - always null for enemies/the Commander, whose defs
    // carry no such field at all, the same "reads whatever's there,
    // naturally absent elsewhere" pattern haste already uses above.
    className: def.className || null,
    // Fear Zone round: a new, genuinely portable trait (not gated to
    // range===1 like Basic/Threat Zone - the PRD names no melee
    // restriction for Fear specifically) - reads whatever the def
    // holds, the same "reads whatever's there, naturally absent
    // elsewhere" pattern haste/className already use. No real unit
    // carries this yet except wyrmgall (enemies.js), the same
    // "portable, authored later" precedent Haste/Guardian's Intercept
    // already established.
    fearsome: !!def.fearsome,
    // Frost Zone round: a second new portable trait, same shape as
    // fearsome - not gated to range===1 (reusing that would sweep in
    // EVERY melee unit's own zone at once, far bigger than intended).
    // Only frostbind (units.js) carries this today.
    frosty: !!def.frosty,
    // Thorn Zone round: a third new portable trait, same shape as
    // fearsome/frosty. Only rootbind-thicket (enemies.js) carries this
    // today.
    thorny: !!def.thorny,
    // Retreat Step round: a fourth new portable trait, same shape as
    // fearsome/frosty/thorny. Only the-hermit (units.js) carries this
    // today.
    wary: !!def.wary,
    // Sidestep round: a fifth new portable trait, same shape as
    // fearsome/frosty/thorny/wary. Only galeblade/windveil (units.js)
    // carry this today - they already have the auto-battler's own real
    // "dodges the first blow each round" evade passive.
    nimble: !!def.nimble,
    // Spirit Shift round: a sixth new portable trait, same shape as
    // nimble. Only beastcaller (units.js) carries this today.
    spiritbound: !!def.spiritbound,
    // Spirit Shift round: a summoned creature (units.js's own
    // summonOnly - only the Spirit Wolf today) IS the "henki" the PRD
    // names - read straight off the def, no new authoring needed.
    isSpirit: side === "player" && !!def.summonOnly,
    triggers,
    phases,
    phaseIndex: 0,
    // Wyrmgall's real Execute/Shatter (bonus damage, see
    // modifiedAttackAmount below) and the final boss's real WoundedFury -
    // folded straight off the unit's own base passive, same discipline as
    // strength. `weak` always starts at 0 - it never appears in a base
    // passive, only ever arriving via a fired effect.
    execute: passiveStats.execute,
    shatter: passiveStats.shatter,
    woundedFury: passiveStats.woundedFury,
    weak: 0,
    // Frost Zone round: the engine's first DURATION-based status (every
    // other stat here is either permanent or a straight damage/heal
    // stack like poison/regen) - never in a base passive, only ever
    // arriving via moveUnit's own leaving-check, so always starts at 0.
    slow: 0,
    // Thorn Zone round: the engine's SECOND duration-based status,
    // reusing slow's own exact mechanism - never in a base passive,
    // only ever arriving via moveUnit's own entering-check.
    root: 0,
    // Retreat Step round: a plain boolean flag, not a decaying
    // counter (this isn't a duration effect) - resets to false at the
    // exact same 2 turn-transition checkpoints slow/root already use,
    // set true only when Retreat Step actually fires.
    retreatStepUsed: false,
    // Sidestep round: the "Reaction Slot" the PRD names - reuses
    // retreatStepUsed's own exact once-per-round boolean shape rather
    // than inventing a new resource pool.
    sidestepUsed: false,
    // Spirit Shift round: same once-per-round boolean shape again.
    spiritShiftUsed: false,
    // Weakened reactions round (Facing PRD's own "puolustajan
    // reaktioiden heikennys" back-hit line): a THIRD duration-based
    // status, reusing slow/root's exact mechanism - never in a base
    // passive, only ever arriving via attackUnit's own back-hit check.
    suppressed: 0,
    // Iron Sentinel's real Bulwark (effects.js's bulwarkOf): a PERSISTENT
    // armour stat, never decremented anywhere - unlike strength/execute/
    // shatter it never appears in a base passive either (Iron Sentinel's
    // own passive is a turnStart TRIGGER that grants it, not a direct
    // stat), so this always starts at a plain 0 and only ever grows via
    // a fired effect.
    bulwark: 0,
    // Thornmaw's real Regen (effects.js's own tickRegen) - trigger-only
    // like Bulwark, never a direct base-passive stat, so this always
    // starts at 0. Thornmaw's real Taunt IS a direct base-passive stat
    // (like execute/shatter/woundedFury), so it folds in here.
    regen: 0,
    taunt: passiveStats.taunt,
    // The final boss's real Revive (effects.js's own dealDamage): a
    // direct base-passive stat, exactly like taunt - folds in here.
    revive: passiveStats.revive,
    // The final boss's real AoE (autoBattleEngine.js's own
    // moveSelect:"weightedRandom") - a mechanic DEFINITION (like charge/
    // covenAura/cultRitual above), not a runtime-mutated stat, so it
    // needs no companion counter field the way charge needs
    // chargeCounter/chargeHpMark: the roll is recomputed fresh from
    // state.turn every decision, never stored on the unit itself.
    aoeMove: side === "enemy" ? aoeMoveFromDef(def) : null,
  }
}

// The Commander: a thin wrapper over deriveTacticsUnit, handing it the
// Commander's own real CHARACTERS[characterId] object directly via
// overrideDef instead of a UNITS/ENEMIES defId lookup. The synthetic
// `commander-${characterId}` id namespaces it clearly - never collides with
// a real defId (every real unit/enemy id is plain kebab-case, never
// prefixed) - and naturally makes ABILITIES[defId] resolve to null (no
// tactics-engine ability this round. Haste round: `deriveTacticsUnit`'s
// own `haste` field already reads straight off `def.haste`, so Tommy's
// real Haste kit flows through automatically with no change needed
// here - Squad Passive/Active Power remain the named deferrals).
// Active Power round: the Commander's REAL activePower (characters.js -
// Opening Strike, Rally Cry, Blood Oath, Brace, Blightcall, Stonewall,
// Grovecall), the same effects array the auto-battler queues from the
// shop, becomes an in-battle, player-triggered "hero power" here: once
// per battle, costs the Commander 1 AP, applied to every LIVING player
// unit for the rest of the fight. When to fire it is the decision. The
// shop's own Essence-bought "next battle only" version is untouched.
function activePowerFor(character) {
  const power = character?.activePower
  if (!power) return null
  return {
    id: power.id,
    name: power.name,
    // The real description is written for the shop ("Next battle only:
    // ...") - the in-battle panel shows just the effect half.
    description: power.description.replace(/^Next battle only:\s*(.)/i, (_, first) => first.toUpperCase()),
    effects: power.effects,
    used: false,
    firedTurn: null,
  }
}

export function activateCommanderPower(state) {
  const power = state.activePower
  const commander = getUnit(state, "player-commander")
  if (!power || power.used || state.phase !== "player") return state
  if (!commander || commander.hp <= 0 || commander.ap < 1) return state
  let next = setUnit(state, commander.id, { ap: commander.ap - 1 })
  for (const unit of next.units) {
    if (unit.side !== "player" || unit.hp <= 0) continue
    for (const effect of power.effects) {
      next =
        effect.type === "addTrigger"
          ? setUnit(next, unit.id, { triggers: [...(getUnit(next, unit.id).triggers || []), { trigger: effect.trigger, effect: effect.effect }] })
          : applyPortableEffect(next, unit.id, effect)
    }
  }
  return {
    ...next,
    ...emit(next, { kind: "power", actorId: commander.id, label: `${power.name}!` }),
    activePower: { ...power, used: true, firedTurn: state.turn },
    log: [...next.log, `${commander.name} calls ${power.name}! ${power.description}`],
  }
}

function deriveCommanderUnit(characterId, pos, uid) {
  return deriveTacticsUnit(`commander-${characterId}`, "player", pos, uid, CHARACTERS[characterId])
}

// `squadDefIds` is an optional 2nd param, defaulting to PLAYER_DEF_IDS (the
// 4 RECRUITED units - the Commander below is always additionally appended,
// never part of this array, since it isn't recruited/swappable via the
// roster) - a caller that passes its own squad array (the sidebar picker)
// still gets whatever recruited lineup it asks for, any size. Rows are
// centered via spreadRows (the same helper createRealMatchupBattle already
// uses for its own arbitrary-size real squads) rather than a hardcoded row
// list, so this works for any squad size without per-size positioning
// logic - `+1` reserves a row for the Commander.
export function createTacticsBattle(formationId = "default", squadDefIds = PLAYER_DEF_IDS) {
  const formation = ENEMY_FORMATIONS[formationId] || ENEMY_FORMATIONS.default
  const playerRows = spreadRows(squadDefIds.length + 1, GRID.rows)
  const enemyRows = spreadRows(formation.enemyDefIds.length, GRID.rows)
  const units = [
    ...squadDefIds.map((defId, i) =>
      deriveTacticsUnit(defId, "player", { row: playerRows[i], col: GRID.cols - 1 }, `player-${defId}-${i}`),
    ),
    deriveCommanderUnit(DEFAULT_COMMANDER_ID, { row: playerRows[squadDefIds.length], col: GRID.cols - 1 }, "player-commander"),
    ...formation.enemyDefIds.map((defId, i) =>
      deriveTacticsUnit(defId, "enemy", { row: enemyRows[i], col: 0 }, `enemy-${defId}-${i}`),
    ),
  ]
  spawnBattleStartSummons(units, GRID)
  // The Commander's real Squad Passive (characters.js) - applied to
  // EVERY player unit before any battle-start snapshot is taken, the
  // same "battle-start bonus, no growth badge" treatment the formation
  // synergy bonus below and every enemy's own passive Strength already
  // get. Commander Rank-Up (a run-long Essence sink spent in the shop)
  // is a named deferral, same reason as Active Power - always applied
  // at the base, un-scaled squadPassive array itself this round.
  const commander = CHARACTERS[DEFAULT_COMMANDER_ID]
  const withSquadPassive = applySquadPassiveToUnits(units, commander.squadPassive || [])
  // A formation's real synergy bonus: a FLAT, one-time Strength grant to
  // every enemy piece at battle start - not multiplied by headcount,
  // matching each shipped mechanic precisely (the aggregate effect scales
  // with body count, the per-unit grant does not). Swarm's is +1, Hunters'
  // is +2 (same shape, a bigger number since the pack hits harder).
  const bonus = formation.battleStartBonus || 0
  const withBonus = bonus
    ? withSquadPassive.map((u) => (u.side === "enemy" ? { ...u, attack: u.attack + bonus } : u))
    : withSquadPassive
  // A one-time snapshot of each unit's attack once battle-start bonuses
  // are applied - the reference point the UI's coven-buff badge compares
  // against (attack > baseAttack), so only a PER-ROUND buff like the
  // Coven's ever shows as growing, not a formation's one-time grant.
  const withBaseline = withBonus.map((u) => ({ ...u, baseAttack: u.attack }))
  return {
    grid: GRID,
    // A formation's own optional terrain map - omitted on every formation
    // that predates this round, defaulting every cell to "path" via
    // terrainAt's own fallback, so nothing about a pre-existing formation
    // changes.
    terrain: formation.terrain || {},
    units: withBaseline,
    phase: "player",
    turn: 1,
    // Tommy's own real, hand-authored description (characters.js) reused
    // verbatim as the opening narration - it already describes all 3 of
    // his squadPassive's real effects in-fiction ("strikes a little
    // harder" = Strength, "lands on its feet" = the turnStart Block,
    // "leaves what it hits swinging softer" = the onDealDamage Weak), so
    // nothing about WHERE those badges keep coming from goes unnarrated.
    log: [commander.description, `${formation.name}. The Frontier opens. Your turn.`],
    formationId: formation.id,
    activePower: activePowerFor(commander),
  }
}

// Spirit Shift round: units.js's own real `summon` field (Beastcaller's
// Spirit Wolf) finally reaches the Frontier - the auto-battler's own
// startAutoBattle already spawns it; this is the tactics mirror. The
// summon lands on the nearest free cell to its summoner (freeCellsNear,
// the same helper Brood's hatchlings use), so it always starts inside
// Spirit Shift's own range. Mutates `units` in place (called right after
// the array literal, before any Squad Passive/baseline pass, so the
// spirit is a normal squad member for every later step).
function spawnBattleStartSummons(units, grid) {
  const summoners = units.filter((u) => u.side === "player" && UNITS[u.defId]?.summon)
  for (const summoner of summoners) {
    const { defId } = UNITS[summoner.defId].summon
    if (!UNITS[defId]) continue
    const [pos] = freeCellsNear({ units, grid }, summoner.pos, 1)
    if (!pos) continue
    units.push(deriveTacticsUnit(defId, "player", pos, `${summoner.id}-summon-${defId}`))
  }
}

// Centers `count` consecutive rows in the grid - the same "one row per
// piece" idea every ENEMY_FORMATIONS entry's hand-picked `rows` array
// already encodes, generalized to any count. Originally built for the
// real-matchup bridge below (a real squad/enemy side can be 1-4 pieces);
// createTacticsBattle's own player-side positioning (squad-size round)
// now reuses this too, in place of a hardcoded per-size row list.
function spreadRows(count, gridRows) {
  const start = Math.max(0, Math.floor((gridRows - count) / 2))
  return Array.from({ length: count }, (_, i) => start + i)
}

// Phase 4's first slice ("jatketaan" -> wire the tactics engine into the
// real game; Marc picked the safe "real preview" scope over a full replace
// of the live battle screen): builds a battle from arbitrary REAL defIds on
// both sides - a real run's actual deployed squad (1-4 units, pulled from
// its save by tacticsRealMatchup.js) vs. the actual enemy at the run's
// current node (any real formation OR solo enemy, resolved by
// formations.js's own resolveFormation - not just the 9 curated
// ENEMY_FORMATIONS entries). Every unit still goes through the SAME
// deriveTacticsUnit every other unit in this engine uses, so real
// abilities (for the 6 units already converted) and every individual
// enemy's own archetype mechanic (covenAura/cultRitual/charge/broodSplit/
// leech/poison - all read straight off that unit's own real ENEMIES def)
// resolve normally. Deliberately does NOT carry over the live game's
// difficulty scaling, relics, or items, and formationId is null so a
// curated formation's PACK-LEVEL synergy bonus (Swarm/Hunters' flat
// Strength, Fortress's per-round Block, Rot's self-mend) never applies
// to an arbitrary real matchup - the same "reuse real data, not the
// live scaling" discipline every archetype round's curated formations
// already follow, just without a formation-level bonus to translate.
//
// Real-fight wiring round: the Commander DOES now carry over, via 2
// new optional params (characterId/commanderRank) defaulting to "no
// Commander" for byte-identical old behavior on any caller that omits
// them - the exact real values (runState.characterId/commanderRank)
// tacticsRealMatchup.js's own resolveRealMatchup now threads through
// from the actual run, not a hardcoded default the way the isolated
// prototype's own createTacticsBattle has to (no shop phase there to
// have earned a real Rank-Up from).
export function createRealMatchupBattle(squadDefIds, enemyDefIds, characterId = null, commanderRank = 0, terrain = {}) {
  const character = characterId ? CHARACTERS[characterId] : null
  const playerRows = spreadRows(squadDefIds.length + (character ? 1 : 0), GRID.rows)
  const enemyRows = spreadRows(enemyDefIds.length, GRID.rows)
  const units = [
    ...squadDefIds.map((defId, i) =>
      deriveTacticsUnit(defId, "player", { row: playerRows[i], col: GRID.cols - 1 }, `player-${defId}-${i}`),
    ),
    ...(character
      ? [deriveCommanderUnit(characterId, { row: playerRows[squadDefIds.length], col: GRID.cols - 1 }, "player-commander")]
      : []),
    ...enemyDefIds.map((defId, i) =>
      deriveTacticsUnit(defId, "enemy", { row: enemyRows[i], col: 0 }, `enemy-${defId}-${i}`),
    ),
  ]
  spawnBattleStartSummons(units, GRID)
  // The real Commander's real Squad Passive, rank-scaled by the run's
  // OWN real commanderRank (unlike createTacticsBattle's own always-
  // rank-0 default) - applied before the baseAttack snapshot, same
  // ordering as createTacticsBattle so the Strength grant folds into
  // baseline rather than showing a misleading growth badge.
  const withSquadPassive = character ? applySquadPassiveToUnits(units, commanderPassiveWithRank(character, commanderRank)) : units
  const withBaseline = withSquadPassive.map((u) => ({ ...u, baseAttack: u.attack }))
  return {
    grid: GRID,
    // Seeded terrain round: a real matchup's own terrain is generated
    // by tacticsRealMatchup.js's generateRealTerrain (seed +
    // nodeIndex-keyed, via seed.js's own reserved "combat" stream) and
    // passed straight through here - this function stays fully
    // unaware the seed system exists at all, exactly like it's always
    // been unaware of ENEMY_FORMATIONS' own hand-authored terrain maps.
    terrain,
    units: withBaseline,
    phase: "player",
    turn: 1,
    // The Commander's own real, hand-authored description reused
    // verbatim as the opening line, same as createTacticsBattle - only
    // when a real Commander is actually present.
    log: character
      ? [character.description, "A real matchup from your run. The Frontier opens. Your turn."]
      : ["A real matchup from your run. The Frontier opens. Your turn."],
    formationId: null,
    activePower: activePowerFor(character),
  }
}

// Tactics-default round (Marc: fights "were still auto-battle" - every
// real run fight now opens as tactics): builds a real run's battle from
// the auto-battle's OWN fully-built start state (runEngine.js's
// autoBattleStartFor), so everything the player earned on the run -
// relics, items, unit upgrades, a shop-queued Active Power, run
// modifiers, the Commander's rank-scaled Squad Passive - and the
// run's difficulty scaling reach this fight with ZERO re-implementation
// here: each tactics unit is derived as usual (move/range/abilities/
// portable traits), then its numbers are overlaid from its auto-battle
// twin. Known limit: effects that act DURING auto-battle rounds (a
// relic's per-round hook) aren't replayed here - only what's true at
// the start of the fight carries over.
//   squad: [{ defId, def }] - def is the upgraded effective def
//   autoStart: the auto-battle start state ({ playerUnits, enemies })
const OVERLAID_POWER_IDS = ["ward", "bulwark", "regen", "execute", "shatter", "woundedFury", "taunt", "revive", "weak", "vulnerable"]
const OVERLAID_TRIGGERS = new Set(["turnStart", "onDealDamage", "onHit", "turnEnd"])

function overlayAutoStart(unit, src, difficultyFactor) {
  const powers = src.powers || {}
  const strength = powers.strength || 0
  // A player unit's derived attack never includes a passive Strength
  // (deriveTacticsUnit folds passives for enemies only), so the whole
  // auto Strength stack adds on top. An enemy's derived attack DOES
  // include its passive Strength, which the auto stack also contains -
  // so rebuild it from the (difficulty-scaled) pattern instead.
  const attack =
    unit.side === "enemy"
      ? Math.round(attackFromMovePattern(ENEMIES[unit.defId].movePattern) * difficultyFactor) + strength
      : unit.attack + strength
  const stats = Object.fromEntries(OVERLAID_POWER_IDS.map((id) => [id, powers[id] || 0]))
  return {
    ...unit,
    ...stats,
    hp: src.hp,
    maxHp: src.maxHp,
    attack,
    baseAttack: attack,
    block: src.block || 0,
    // Enemies keep their own derived triggers (the auto-battle also adds
    // leech/broodSplit as triggers, which this engine models as fields).
    triggers:
      unit.side === "player"
        ? (src.triggers || []).filter((t) => OVERLAID_TRIGGERS.has(t.trigger)).map((t) => ({ trigger: t.trigger, effect: t.effect }))
        : unit.triggers,
  }
}

function autoTwinFor(unit, autoStart) {
  if (unit.side === "enemy") return autoStart.enemies[Number(unit.id.split("-").pop())] || null
  if (unit.id === "player-commander") return autoStart.playerUnits.find((u) => u.id === "commander") || null
  const summon = unit.id.match(/^player-.*-(\d+)-summon-/)
  if (summon) return autoStart.playerUnits.find((u) => u.id === `p-summon-p${summon[1]}`) || null
  return autoStart.playerUnits.find((u) => u.id === `p${Number(unit.id.split("-").pop())}`) || null
}

export function createRunTacticsBattle({ squad, enemyDefIds, characterId, terrain = {}, autoStart, difficultyFactor = 1, label, relicIds = [] }) {
  const character = CHARACTERS[characterId]
  if (!character || !enemyDefIds.length) return null
  const playerRows = spreadRows(squad.length + 1, GRID.rows)
  const enemyRows = spreadRows(enemyDefIds.length, GRID.rows)
  const units = [
    ...squad.map(({ defId, def }, i) =>
      deriveTacticsUnit(defId, "player", { row: playerRows[i], col: GRID.cols - 1 }, `player-${defId}-${i}`, def),
    ),
    deriveCommanderUnit(characterId, { row: playerRows[squad.length], col: GRID.cols - 1 }, "player-commander"),
    ...enemyDefIds.map((defId, i) =>
      deriveTacticsUnit(defId, "enemy", { row: enemyRows[i], col: 0 }, `enemy-${defId}-${i}`),
    ),
  ]
  spawnBattleStartSummons(units, GRID)
  const overlaid = units.map((u) => {
    const twin = autoTwinFor(u, autoStart)
    if (!twin) return { ...u, baseAttack: u.attack }
    // A Trial's story name (runEngine.js's applyTrialName) rides along.
    const named = u.side === "enemy" && twin.name ? { ...u, name: twin.name } : u
    const base = overlayAutoStart(named, twin, difficultyFactor)
    return { ...base, ...relicFx.relicOverlayPatch(base, twin, relicIds) }
  })
  return {
    grid: GRID,
    terrain,
    units: overlaid,
    phase: "player",
    turn: 1,
    log: [character.description, `${label || "The fight"}. The Frontier opens. Your turn.`],
    formationId: null,
    activePower: activePowerFor(character),
  }
}

// Deployment phase (sprint 2): before turn 1 the player arranges the
// squad inside its own 3 rightmost columns, with the enemy, its intents
// and the terrain already visible. The builders stay in "player" (so
// every existing caller/check is unchanged); a caller opts a fresh
// battle into setup with enterDeploy. While phase === "deploy" every
// other action is refused by its own existing `phase !== side` guard.
export const DEPLOY_COLS = 3

export function isDeployTile(state, pos) {
  const { rows, cols } = state.grid
  if (!pos || pos.row < 0 || pos.row >= rows || pos.col < 0 || pos.col >= cols) return false
  if (pos.col < cols - DEPLOY_COLS) return false
  // Water can't be stood on; a poison pool isn't a place to start in.
  const terrain = TERRAIN[terrainAt(state, pos)]
  return terrain.cost !== Infinity && !terrain.grantPoison
}

export function enterDeploy(state) {
  if (!state || state.phase !== "player" || state.turn !== 1 || state.deployDone) return state
  return { ...state, phase: "deploy", log: [...state.log, "Place your units - enemies act after your first turn."] }
}

// Moves a living player unit to a free deploy tile, or swaps it with the
// player unit already standing there. Anything else returns `state`.
export function placeUnit(state, unitId, pos) {
  if (state.phase !== "deploy") return state
  const unit = getUnit(state, unitId)
  if (!unit || unit.side !== "player" || unit.hp <= 0 || unit.npc) return state
  if (!isDeployTile(state, pos)) return state
  if (samePos(unit.pos, pos)) return state
  const occupant = state.units.find((u) => u.hp > 0 && samePos(u.pos, pos))
  if (occupant && (occupant.side !== "player" || occupant.npc)) return state
  const target = { row: pos.row, col: pos.col }
  return {
    ...state,
    units: state.units.map((u) =>
      u.id === unit.id ? { ...u, pos: target } : occupant && u.id === occupant.id ? { ...u, pos: { ...unit.pos } } : u,
    ),
  }
}

export function beginBattle(state) {
  if (state.phase !== "deploy") return state
  return { ...state, phase: "player", deployDone: true, log: [...state.log, "The battle begins."] }
}

// A static stat preview of the whole 6-unit roster, for the squad picker's
// per-slot stat line - zero new derivation logic, reuses deriveTacticsUnit
// directly (the exact same function a real squad unit goes through), just
// with a throwaway pos/id since these are never placed on a real board.
export function previewPlayerRoster() {
  return PLAYER_ROSTER_IDS.map((defId, i) => deriveTacticsUnit(defId, "player", { row: 0, col: 0 }, `preview-${defId}-${i}`))
}

// Battle feel round: a small append-only feed of what just HAPPENED
// (a strike, the damage it did, a Ward, a reaction) for the board to
// replay as lunges, hit flashes, floating numbers and sounds - the state
// itself only ever shows the END result of an action (and one End Turn
// resolves the whole enemy phase at once). Each event carries a rising
// `seq` so the UI plays only what's new; capped so a save never grows.
// Purely descriptive - no game rule ever reads it.
const MAX_EVENTS = 80
function emit(state, event) {
  const seq = (state.eventSeq || 0) + 1
  return { ...state, eventSeq: seq, events: [...(state.events || []), { ...event, seq }].slice(-MAX_EVENTS) }
}

function getUnit(state, id) {
  return state.units.find((u) => u.id === id)
}

function setUnit(state, id, patch) {
  return { ...state, units: state.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) }
}

function livingUnits(state, side) {
  return state.units.filter((u) => u.side === side && u.hp > 0)
}

function chebyshevDist(a, b) {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
}

// Frost Zone round: this engine's first DURATION-based movement
// reduction. Floored at 1 (never fully immobilizes - that's Thorn
// Zone's own Root, out of scope this round). `unit.slow > 0` is safe
// against a missing field on any pre-existing hand-built synthetic
// unit (`undefined > 0` is `false`, the same safety `weak`/`fearsome`
// checks already rely on) - byte-identical for every existing check.
function effectiveMove(unit) {
  return unit.slow > 0 ? Math.max(1, unit.move - 1) : unit.move
}

// Reachable tiles for a unit right now: the grid's own BFS, blocked by
// every OTHER living piece on the board (either side - you can't walk
// through anyone).
export function reachableTilesFor(state, unitId) {
  const unit = getUnit(state, unitId)
  if (!unit || unit.hp <= 0) return []
  // Thorn Zone round: a rooted unit cannot move AT ALL - a hard stop,
  // placed as the literal first check so nothing else in this
  // function (Threat Zone's own cap included) ever runs for it.
  // Attacking is untouched (Root is movement-only, not a full stun -
  // this engine has no stun/status system at all yet).
  if (unit.root > 0) return []
  const occupied = state.units.filter((u) => u.id !== unitId && u.hp > 0).map((u) => u.pos)
  const opposingSide = unit.side === "player" ? "enemy" : "player"
  // Only a unit APPROACHING from clean ground is capped - one already
  // standing inside an opposing Threat Zone (adjacent to a tanky
  // enemy, mid-engagement) can still maneuver normally nearby, the
  // same way Basic Zone's own reaction only fires on truly LEAVING,
  // not on every step taken while already close. Without this guard a
  // unit that starts inside ANY opposing threat zone could barely move
  // at all - over-punishing, not "blocks advancing" as the PRD says.
  const startedInsideThreatZone = threatZoneControllers(state, unit.pos, opposingSide).length > 0
  return reachableTilesRaw(occupied, unit.pos, effectiveMove(unit), state.grid, (pos) => {
    const baseCost = TERRAIN[terrainAt(state, pos)].cost
    // Threat Zone round (Movement PRD §4.3): entering a cell inside an
    // opposing Threat Zone consumes the mover's ENTIRE move budget for
    // this action - a hard-to-press-past deterrent, not a flat "you
    // may never enter" wall (that would make the controller itself
    // unmeleeable from outside its own zone). `unit.move` (not
    // Infinity) is exactly the cost that always exhausts whatever
    // budget remains once spent here.
    if (!startedInsideThreatZone && threatZoneControllers(state, pos, opposingSide).length > 0) return unit.move
    return baseCost
  })
}

// Enemies (or allies) within the unit's range of its CURRENT tile - a
// prototype-simple range check (Chebyshev, same metric kingAdjacent uses
// for its single-step case), not yet a real line-of-sight system.
// Thornmaw's real Taunt (autoBattleEngine.js's own threatTarget): read
// directly, the function that actually PICKS a target does
// `const taunters = living.filter(u => (u.powers.taunt||0) > 0); const
// pool = taunters.length ? taunters : unshieldedOrAll(...)` - a genuine
// HARD filter, not the soft "priority weight" the nearby THREAT.taunt
// comment describes (that constant feeds a DIFFERENT function,
// unitThreat's own scoring, used only to sort WITHIN an already-taunt-
// filtered pool). So restricting the player's own valid targets to only
// a living taunter is a faithful port, not an invented restriction.
// Abilities sprint: a Taunt Shout taunts only for the turn it was cast
// (through the enemy phase) - `shoutTurn` expires itself, no decay step.
function isTaunting(state, u) {
  return u.taunt > 0 || (u.shoutTurn != null && u.shoutTurn === state.turn)
}

function livingTaunters(state, side) {
  return livingUnits(state, side).filter((u) => isTaunting(state, u))
}

export function attackableTargets(state, unitId) {
  const unit = getUnit(state, unitId)
  if (!unit || unit.hp <= 0) return []
  const inRange = state.units.filter(
    (u) => u.side !== unit.side && u.hp > 0 && chebyshevDist(unit.pos, u.pos) <= unit.range,
  )
  const taunters = livingTaunters(state, unit.side === "player" ? "enemy" : "player")
  return taunters.length ? inRange.filter((u) => isTaunting(state, u)) : inRange
}

function checkTacticsBattleEnd(state) {
  if (state.phase === "won" || state.phase === "lost") return state
  // Battle objectives (tacticsObjectives.js) decide first.
  const verdict = objectiveVerdict(state)
  if (verdict) return { ...state, phase: verdict.phase, log: [...state.log, verdict.line] }
  if (livingUnits(state, "enemy").length === 0) return { ...state, phase: "won", log: [...state.log, "Every enemy has fallen. Victory."] }
  // A Protect NPC alone doesn't keep the fight going.
  if (livingUnits(state, "player").filter((u) => !u.npc).length === 0) return { ...state, phase: "lost", log: [...state.log, "The squad has fallen."] }
  return state
}

// Zone of Control round (Movement PRD §4.3, Basic Zone - the PRD's own
// simplest sub-type): "lähitaisteluyksiköt hallitsevat ympärillään
// olevia ruutuja" - MELEE units control the tiles around them.
// `range === 1` is this engine's own real single-vs-pattern-attacker
// distinction (the same gate Haste/Facing already use for "melee") -
// a range-3 pattern-attacker projects no zone at all, matching the
// PRD's own wording exactly. `kingAdjacent` (targeting.js) - already
// used for Bulwark Aura's own reach - is the exact adjacency Basic
// Zone needs.
function zocControllers(state, pos, side) {
  return state.units.filter((u) => u.side === side && u.hp > 0 && u.range === 1 && kingAdjacent(u.pos, pos))
}

// Threat Zone round (Movement PRD §4.3): "hallitsee suurempaa aluetta
// ja voi estää etenemistä" - controls a LARGER area and can block
// advancing. `move === 2` is the exact real, already-existing signal
// for "this melee unit is big/tanky" (moveFromMaxHp already grants it
// to every maxHp>=40 unit, symmetric across both sides, zero new
// authoring) - reused directly rather than inventing a new field.
// ADDITIVE, not a replacement: a tanky melee unit keeps its full Basic
// Zone behavior (the reaction attack above) completely unchanged, and
// separately ALSO projects this wider zone - confirmed necessary since
// rotwood-husk (maxHp 58) already has real, shipped, verified Basic
// Zone reaction behavior that a REPLACEMENT design would have silently
// removed.
function isTankyMelee(unit) {
  return unit.range === 1 && unit.move === 2
}

function threatZoneControllers(state, pos, side) {
  return state.units.filter((u) => u.side === side && u.hp > 0 && isTankyMelee(u) && chebyshevDist(u.pos, pos) <= 2)
}

// Every "row-col" cell currently controlled by a living tanky-melee
// `side` unit, radius 2 - for the UI, the same static-board-property
// pattern zoneOfControlCells already established.
export function threatZoneCells(state, side) {
  const cells = new Set()
  for (const controller of state.units.filter((u) => u.side === side && u.hp > 0 && isTankyMelee(u))) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue
        const pos = { row: controller.pos.row + dr, col: controller.pos.col + dc }
        if (isOnBoard(pos, state.grid)) cells.add(`${pos.row}-${pos.col}`)
      }
    }
  }
  return cells
}

// Fear Zone round (Movement PRD §4.3): "Heikentää yksiköitä, jotka
// yrittävät lähestyä" - weakens units trying to APPROACH it. No
// `range` gate at all (a deliberate departure from Basic/Threat Zone's
// own melee-only wording, since the PRD names no such restriction for
// Fear specifically) - any `fearsome` unit projects it, radius 1 (the
// PRD's own base case, since it never says Fear is a "larger area"
// the way it explicitly does for Threat Zone).
function fearZoneControllers(state, pos, side) {
  return state.units.filter((u) => u.side === side && u.hp > 0 && u.fearsome && kingAdjacent(u.pos, pos))
}

// Every "row-col" cell currently controlled by a living `fearsome`
// `side` unit, radius 1 - for the UI, the same static-board-property
// pattern zoneOfControlCells/threatZoneCells already established.
export function fearZoneCells(state, side) {
  const cells = new Set()
  for (const controller of state.units.filter((u) => u.side === side && u.hp > 0 && u.fearsome)) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const pos = { row: controller.pos.row + dr, col: controller.pos.col + dc }
        if (isOnBoard(pos, state.grid)) cells.add(`${pos.row}-${pos.col}`)
      }
    }
  }
  return cells
}

// Thorn Zone round (Movement PRD §4.3): "Aiheuttaa vahinkoa tai
// Root-tilan" - Marc picked Root. Same non-melee-gating reasoning as
// Fear/Frost Zone - any `thorny` unit projects it, radius 1 (the
// PRD's own base case). ENTERING-triggered (mirrors Fear Zone's own
// direction, not Frost/Basic Zone's leaving) - matches
// rootbind-thicket's own flavor ("when they catch you") directly.
function thornZoneControllers(state, pos, side) {
  return state.units.filter((u) => u.side === side && u.hp > 0 && u.thorny && kingAdjacent(u.pos, pos))
}

// Every "row-col" cell currently controlled by a living `thorny`
// `side` unit, radius 1 - for the UI, the same static-board-property
// pattern fearZoneCells/frostZoneCells already established.
export function thornZoneCells(state, side) {
  const cells = new Set()
  for (const controller of state.units.filter((u) => u.side === side && u.hp > 0 && u.thorny)) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const pos = { row: controller.pos.row + dr, col: controller.pos.col + dc }
        if (isOnBoard(pos, state.grid)) cells.add(`${pos.row}-${pos.col}`)
      }
    }
  }
  return cells
}

// ROOT_DURATION reuses SLOW_DURATION's own exact decay-ordering math
// (see its own comment below) - granting 2 produces exactly 1 turn of
// full immobilization, then a clean return to normal.
const ROOT_DURATION = 2

// Frost Zone round (Movement PRD §4.3): "Hidastaa poistuvia yksiköitä" -
// slows units LEAVING it. Same non-melee-gating reasoning as Fear
// Zone (the PRD names no melee restriction for Frost specifically,
// and reusing bare range===1 would sweep in every melee unit at
// once) - any `frosty` unit projects it, radius 1 (the PRD's own base
// case, no "larger area" wording the way Threat Zone gets).
//
// SLOW_DURATION reuses this file's own cooldownRemaining ordering
// (decay BEFORE the owner's own turn's actions, at the exact spots
// cooldownRemaining already decays) - "a cooldown of 2 plays out as
// usable every other turn: cast on turn N, cooling on N+1, ready on
// N+2" (see runEnemyTurn's own comment) means a granted counter of N
// produces exactly N-1 turns of VISIBLE effect. 2 is the smallest
// value that still demonstrates genuine duration-based decay: exactly
// 1 turn of reduced movement, then back to normal.
const SLOW_DURATION = 2

// Weakened reactions round: identical decay math to SLOW_DURATION/
// ROOT_DURATION above - granting 2 produces exactly 1 turn of visible
// suppression, then a clean return to normal.
const SUPPRESSED_DURATION = 2

function frostZoneControllers(state, pos, side) {
  return state.units.filter((u) => u.side === side && u.hp > 0 && u.frosty && kingAdjacent(u.pos, pos))
}

// Every "row-col" cell currently controlled by a living `frosty`
// `side` unit, radius 1 - for the UI, the same static-board-property
// pattern fearZoneCells/threatZoneCells/zoneOfControlCells already
// established.
export function frostZoneCells(state, side) {
  const cells = new Set()
  for (const controller of state.units.filter((u) => u.side === side && u.hp > 0 && u.frosty)) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const pos = { row: controller.pos.row + dr, col: controller.pos.col + dc }
        if (isOnBoard(pos, state.grid)) cells.add(`${pos.row}-${pos.col}`)
      }
    }
  }
  return cells
}

// Every "row-col" cell currently controlled by a living melee `side`
// unit - for the UI (a static board property, not relative to
// whichever unit is selected, unlike reachable/targetable overlays).
export function zoneOfControlCells(state, side) {
  const cells = new Set()
  for (const controller of state.units.filter((u) => u.side === side && u.hp > 0 && u.range === 1)) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const pos = { row: controller.pos.row + dr, col: controller.pos.col + dc }
        if (isOnBoard(pos, state.grid)) cells.add(`${pos.row}-${pos.col}`)
      }
    }
  }
  return cells
}

// Zone Disengage Toll round (Movement PRD §4.3's general preamble):
// "poistuminen voi maksaa lisä-AP:tä" - leaving MAY cost extra AP, a
// property of the WHOLE Zone of Control system (this line sits in the
// general "enters an enemy's Zone of Control" preamble, not under any
// one named sub-type) - so this ORs together all 5 existing controller
// checks into one combined "is this position inside ANY opposing zone
// right now" test, reusing every controller function wholesale.
function insideAnyOpposingZone(state, pos, side) {
  return (
    zocControllers(state, pos, side).length > 0 ||
    threatZoneControllers(state, pos, side).length > 0 ||
    fearZoneControllers(state, pos, side).length > 0 ||
    frostZoneControllers(state, pos, side).length > 0 ||
    thornZoneControllers(state, pos, side).length > 0
  )
}

// A flat, unconditional toll - charged EXACTLY ONCE per move that
// leaves ANY opposing zone (not per zone type, even if 2 overlapped),
// additive on top of whatever else that same transition already does
// (Basic Zone's reaction, Frost Zone's Slow, etc.) - Marc's own
// explicit "all zone types, on top of" pick.
const ZONE_LEAVE_AP_TOLL = 1

export function moveUnit(state, unitId, targetPos) {
  const unit = getUnit(state, unitId)
  if (!unit || unit.hp <= 0 || unit.ap < 1) return state
  if (state.phase !== unit.side) return state
  if (!isOnBoard(targetPos, state.grid)) return state
  const legal = reachableTilesFor(state, unitId)
  if (!legal.some((p) => samePos(p, targetPos))) return state
  // Facing round: a unit that just moved now faces the direction it
  // traveled - attacking in place never turns a unit around, only an
  // actual move does.
  const facing = cardinalDir(targetPos.col - unit.pos.col, targetPos.row - unit.pos.row)
  let next = setUnit(state, unitId, { pos: targetPos, ap: unit.ap - 1, facing })
  // Poison Ground (Hearthwood Frontier's own real "trap" terrain): grants
  // a stack ONLY on arrival at the move's own destination tile - never
  // on any intermediate tile the pathfinding happened to route through -
  // reusing the EXISTING poison field/tick (applyPoisonTick, Rot
  // archetype) wholesale, zero new damage-over-time machinery.
  const grant = TERRAIN[terrainAt(next, targetPos)].grantPoison
  if (grant) {
    const arrived = getUnit(next, unitId)
    next = setUnit(next, unitId, { poison: arrived.poison + grant })
    next = { ...next, log: [...next.log, `${unit.name} wades into the poison and starts coughing (+${grant}).`] }
  }
  const opposingSide = unit.side === "player" ? "enemy" : "player"
  // Fear Zone round: a unit that just moved from OUTSIDE an opposing
  // Fear Zone to a cell INSIDE one - the same "approaching from clean
  // ground" transition Threat Zone's own step-cost check already
  // established, reused here as a plain boolean check instead - gains
  // one stack of the EXISTING `weak` debuff, permanent for the rest of
  // the battle (matching `weak`'s own already-established behavior
  // everywhere else in this engine - never decays, checked as `> 0`).
  // Both checks use the SAME pre-move `state` (a controller's own
  // position never changes during the mover's own action).
  const enteredFearZone =
    fearZoneControllers(state, targetPos, opposingSide).length > 0 && fearZoneControllers(state, unit.pos, opposingSide).length === 0
  if (enteredFearZone) {
    const arrived = getUnit(next, unitId)
    next = setUnit(next, unitId, { weak: arrived.weak + 1 })
    next = { ...next, log: [...next.log, `${unit.name} recoils in fear, weakened!`] }
  }
  // Thorn Zone round: the SAME entering transition as Fear Zone above,
  // a different consequence - a unit moving from OUTSIDE an opposing
  // Thorn Zone to INSIDE it gains a fresh ROOT_DURATION stack of the
  // new `root` status (this engine's SECOND duration-based status,
  // reusing `slow`'s own exact mechanism). `(arrived.root || 0)`
  // guards a hand-built synthetic unit missing the field entirely.
  const enteredThornZone =
    thornZoneControllers(state, targetPos, opposingSide).length > 0 && thornZoneControllers(state, unit.pos, opposingSide).length === 0
  if (enteredThornZone) {
    const arrived = getUnit(next, unitId)
    next = setUnit(next, unitId, { root: (arrived.root || 0) + ROOT_DURATION })
    next = { ...next, log: [...next.log, `${unit.name} is caught in the thorns, rooted!`] }
  }
  // Frost Zone round: the mirror transition of Fear Zone above - a unit
  // that just moved from INSIDE an opposing Frost Zone to a cell
  // OUTSIDE it (the same "leaving" direction Zone of Control's own
  // reaction below already uses, just a different consequence) gains a
  // fresh SLOW_DURATION stack of the new `slow` status. `(arrived.slow
  // || 0)` guards a hand-built synthetic unit missing the field
  // entirely. Same SAME-pre-move-`state` guarantee as Fear Zone above.
  const leftFrostZone =
    frostZoneControllers(state, unit.pos, opposingSide).length > 0 && frostZoneControllers(state, targetPos, opposingSide).length === 0
  if (leftFrostZone) {
    const arrived = getUnit(next, unitId)
    next = setUnit(next, unitId, { slow: (arrived.slow || 0) + SLOW_DURATION })
    next = { ...next, log: [...next.log, `${unit.name} staggers away, slowed by the frost!`] }
  }
  // Zone Disengage Toll round: leaving ANY opposing zone (checked ONCE
  // via the combined insideAnyOpposingZone, not per zone type) costs
  // 1 extra AP, additive on top of whatever else this same transition
  // already triggers above (Frost Zone's Slow) or below (Basic Zone's
  // reaction). Floored at 0, never negative - a unit that already
  // spent its last AP on the move itself simply has nothing left for
  // the toll to take. Same SAME-pre-move-`state` guarantee as every
  // other zone transition above.
  const leftAnyZone = insideAnyOpposingZone(state, unit.pos, opposingSide) && !insideAnyOpposingZone(state, targetPos, opposingSide)
  if (leftAnyZone) {
    const arrived = getUnit(next, unitId)
    next = setUnit(next, unitId, { ap: Math.max(0, arrived.ap - ZONE_LEAVE_AP_TOLL) })
    next = { ...next, log: [...next.log, `${unit.name} struggles to break away, -${ZONE_LEAVE_AP_TOLL} AP!`] }
  }
  // Zone of Control round: a living, melee OPPOSING controller of the
  // unit's own ORIGIN tile (`unit.pos`, captured before any of the
  // updates above - a controller's own position never changes here,
  // only the mover's does) that no longer controls the DESTINATION
  // gets one free reaction attack - the classic "opportunity attack."
  // Re-checks the mover's own live hp and the battle's own phase
  // before each subsequent controller's swing, so a flanking pair
  // never both attack a corpse or fire into an already-ended battle.
  // Weakened reactions round: a suppressed controller simply doesn't
  // appear in the reaction-triggering list at all.
  const leavingControllers = zocControllers(state, unit.pos, opposingSide).filter(
    (controller) => !kingAdjacent(controller.pos, targetPos) && !(controller.suppressed > 0),
  )
  for (const controller of leavingControllers) {
    if (next.phase === "won" || next.phase === "lost") break
    const mover = getUnit(next, unitId)
    if (!mover || mover.hp <= 0) break
    next = { ...next, log: [...next.log, `${controller.name} lashes out as ${unit.name} pulls away!`] }
    next = attackUnit(next, controller.id, unitId, { isReaction: true })
  }
  return next
}

// Wyrmgall's real Execute/Shatter + the final boss's real WoundedFury/
// Weak - ported directly from effects.js's own dealDamage modifier
// chain, in the SAME real order (confirmed by reading that function line
// by line, not assumed): WoundedFury adds a flat +3 while the ATTACKER
// itself is below half its own max HP; Weak then multiplies the whole
// amount so far by 0.75 (floored) - BEFORE Execute/Shatter, so neither
// bonus is itself reduced by Weak, exactly matching the real
// `amount += executeBonus + shatterBonus` line landing after the real
// game's own Weak multiply; Execute adds a flat, stack-scaled bonus only
// once the DEFENDER is at/under 30% max HP; Shatter adds its own flat
// bonus only while the defender still holds any Block. Real Strength is
// NOT re-added here - this engine already bakes it straight into
// `attacker.attack` at derive/phase time, unlike the real game's own
// dealDamage, which adds it fresh on every hit from a separate `powers`
// stack.
// Facing round (Movement & Tactical Gameplay PRD §4.2): buckets a raw
// position delta into one of 4 cardinals by dominant axis - the PRD's
// own simpler base case (8 directions is explicitly its "enhanced"
// option, not the starting one).
function cardinalDir(dCol, dRow) {
  if (Math.abs(dCol) >= Math.abs(dRow)) return dCol >= 0 ? "E" : "W"
  return dRow >= 0 ? "S" : "N"
}

const OPPOSITE_DIR = { N: "S", S: "N", E: "W", W: "E" }

// Retreat Step round: the one small missing piece cardinalDir/
// OPPOSITE_DIR don't already provide - turning a direction string
// back into a board offset.
const DIR_DELTA = { N: { dRow: -1, dCol: 0 }, S: { dRow: 1, dCol: 0 }, E: { dRow: 0, dCol: 1 }, W: { dRow: 0, dCol: -1 } }

// Sidestep round: "sideways" relative to a unit's own facing has 2
// candidates (left/right) - nothing in this engine has needed a
// rotation concept before. Tries right first, then left.
const RIGHT_OF_DIR = { N: "E", E: "S", S: "W", W: "N" }
const LEFT_OF_DIR = { N: "W", W: "S", S: "E", E: "N" }
// No PRD number given ("voi välttää hyökkäyksen" - MAY avoid, not a
// guarantee) and no existing percentage-chance number anywhere to
// reuse (the auto-battler's own `evade` buff is a guaranteed per-stack
// dodge counter, a different shape) - a clean, easily-explained
// coinflip, my own stated design call.
const SIDESTEP_DODGE_CHANCE = 0.5

// Sidestep round: tries the tile to the right of the unit's own facing
// first, then left, returning the first that's on-board and
// unoccupied - the same occupancy check Retreat Step's own destination
// logic already uses, just with a second candidate before giving up.
function sidestepDestination(state, target) {
  for (const dir of [RIGHT_OF_DIR[target.facing], LEFT_OF_DIR[target.facing]]) {
    const delta = DIR_DELTA[dir]
    const candidate = { row: target.pos.row + delta.dRow, col: target.pos.col + delta.dCol }
    const occupied = state.units.some((u) => u.id !== target.id && u.hp > 0 && samePos(u.pos, candidate))
    if (isOnBoard(candidate, state.grid) && !occupied) return candidate
  }
  return null
}

// Classifies an attack against the DEFENDER's own current facing -
// front/side/back, the PRD's own 3-way split. Only the defender's
// facing and both units' positions matter (the attacker's own facing
// is irrelevant here, matching the PRD's own wording - it describes
// the defender's exposure, not the attacker's stance). Defaults to
// "front" (no bonus) when the defender carries no `facing` field at
// all - the exact pre-Facing-round behavior, so every pre-existing
// hand-built synthetic-state check (none of which set `facing`) stays
// byte-identical rather than picking up an unintended new bonus.
function classifyFacingAttack(attacker, defender) {
  if (!defender.facing) return "front"
  const attackDir = cardinalDir(attacker.pos.col - defender.pos.col, attacker.pos.row - defender.pos.row)
  if (attackDir === defender.facing) return "front"
  if (attackDir === OPPOSITE_DIR[defender.facing]) return "back"
  return "side"
}

// The PRD's own real numbers (§4.2): front normal, side +10%, back
// +25%. The "chance to weaken Block"/"chance to crit"/"weakens
// reactions" pieces are each tied to a mechanic this engine doesn't
// have yet (Block-sunder, crits, Zone-of-Control reactions) - named,
// deliberate deferrals, not part of this round's own multiplier.
const FACING_BASE_PP = { side: 10, back: 25 }

// Per-class Facing round (Movement PRD §4.2's last unbuilt piece): the
// PRD names 10 abstract classes (Assassin/Duelist/Ranger/Striker/
// Hunter/Saboteur benefit; Guardian/Sentinel/Warden/Juggernaut resist),
// but the 48 real recruitable units (units.js) use a completely
// different flavor taxonomy - only "Guardian" literally matches. Mapped
// by theme onto the real classes instead (confirmed directly by
// reading every className+role pair in units.js): every real tank-role
// class (wall/ward/bulwark-flavored) resists, and the dps-role classes
// with a precise/mobile/shadow flavor (not every dps - blunt brawlers
// like Berserker/Bruiser/Zealot stay neutral) benefit. Enemies/the
// Commander carry no className at all, so they always stay neutral -
// a stated scope limit, not a bug.
const FLANK_BENEFIT_CLASSES = new Set([
  "Nightblade", "Reaver", "Skirmisher", "Venomtongue", "Cutter",
  "Silencer", "Umbramancer", "Frostblade", "Briarblade", "Marksman",
])
const FLANK_RESIST_CLASSES = new Set([
  "Bulwark", "Crownguard", "Stonewarden", "Ironbark", "Graveguard",
  "Decoy", "Keystone", "Keeper", "Bearer", "Guardian",
])
const FLANK_BENEFIT_PP = { side: 5, back: 10 }
const FLANK_RESIST_PP = { side: 5, back: 10 }

export function flankRole(className) {
  if (!className) return null
  if (FLANK_BENEFIT_CLASSES.has(className)) return "benefit"
  if (FLANK_RESIST_CLASSES.has(className)) return "resist"
  return null
}

// Block-weakening/Crit round (Movement PRD §4.2's last 2 named
// effects, "always happens" per Marc's own pick over real randomness -
// keeps every check able to assert one exact number). Crit is a flat,
// unconditional bonus on every back hit - reuses the SAME pp formula
// Facing/per-class already use, so the per-class benefit/resist
// adjustments (and their own cancel-out property) still apply on top,
// unaffected by this flat addition.
const CRIT_BONUS_PP = 25

// Composes so a benefiting attacker vs a resisting defender lands
// exactly back on the base numbers - a nimble flanker gets no extra
// edge attacking a naturally sturdy target, an intentional cancel-out,
// not a coincidence.
function facingMultiplier(attacker, defender, facing) {
  if (facing === "front") return 1
  let pp = FACING_BASE_PP[facing]
  if (facing === "back") pp += CRIT_BONUS_PP
  if (flankRole(attacker.className) === "benefit") pp += FLANK_BENEFIT_PP[facing]
  if (flankRole(defender.className) === "resist") pp -= FLANK_RESIST_PP[facing]
  return 1 + pp / 100
}

function modifiedAttackAmount(attacker, defender, baseAmount) {
  let amount = baseAmount
  if (attacker.woundedFury > 0 && attacker.hp < attacker.maxHp * 0.5) amount += 3
  if (attacker.weak > 0) amount = Math.floor(amount * 0.75)
  // Active Power round: effects.js's own Vulnerable - the defensive
  // mirror of Weak, +25% damage TAKEN (rounded down), applied at the
  // same point in the chain. Permanent here, same as this engine's Weak.
  if (defender.vulnerable > 0) amount = Math.floor(amount * 1.25)
  const facing = classifyFacingAttack(attacker, defender)
  if (facing !== "front") amount = Math.round(amount * facingMultiplier(attacker, defender, facing))
  if (attacker.execute > 0 && defender.hp <= defender.maxHp * 0.3) amount += attacker.execute
  if (attacker.shatter > 0 && defender.block > 0) amount += attacker.shatter
  return relicFx.dampenedAmount(attacker, amount)
}

// Retreat Step round: a clearly "significant" single-hit threshold,
// scaled per-unit like this engine's own existing HP-percentage
// precedents (woundedFury 50%, execute 30%) - but those are STATUS
// checks on current HP, this checks the SIZE of the hit itself, a
// genuinely different trigger shape, so it gets its own real number.
const RETREAT_STEP_HP_THRESHOLD_PCT = 0.25

// Reuses the live game's own Block model (effects.js's dealDamage: absorb
// then deplete) rather than inventing a new mitigation shape.
// Iron Sentinel's real Bulwark (effects.js's own dealDamage): real Block
// is spent FIRST, then Bulwark absorbs whatever's left - but Bulwark is
// never decremented, so it keeps soaking the same amount off every hit,
// all battle (the exact real order, not assumed - Block's own "spent
// and reset every round" behavior never applies to it).
function applyDamageWithBlock(state, targetId, amount) {
  const target = getUnit(state, targetId)
  const evaded = relicFx.tryEvade(state, targetId, amount)
  if (evaded) return evaded
  // Active Power round: effects.js's own Ward - one stack cancels the
  // ENTIRE next hit, whatever its size, before Block/Bulwark/Revive are
  // ever consulted (the real dealDamage's own ordering). Only spent on a
  // hit that would actually deal something.
  if (amount > 0 && target.ward > 0) {
    const next = emit(setUnit(state, targetId, { ward: target.ward - 1 }), { kind: "ward", targetId })
    return {
      next: { ...next, log: [...next.log, `${target.name}'s Ward absorbs the hit completely.`] },
      absorbed: 0,
      armourUsed: 0,
      remaining: 0,
      fell: false,
      revived: false,
    }
  }
  const armour = target.bulwark || 0
  const totalAbsorb = Math.min(target.block + armour, amount)
  const blockSpent = Math.min(target.block, totalAbsorb)
  const armourUsed = totalAbsorb - blockSpent
  const remaining = amount - totalAbsorb
  const rawHp = target.hp - remaining
  // The final boss's real Revive (effects.js's own dealDamage): a stack
  // consumed exactly once, the instant a hit would otherwise drop the
  // unit to 0 or below - caught HERE, before the ordinary clamp, since
  // that clamp is what "dead" means everywhere else (checkTacticsBattleEnd,
  // every hp<=0 filter, `fell` itself). `target.hp > 0` guards a unit
  // already at 0 from reviving off a follow-up hit - the exact same
  // ordering/guard the real function uses, read directly, not assumed.
  const revives = target.revive || 0
  const revived = rawHp <= 0 && target.hp > 0 && revives > 0
  const nextHp = revived ? 1 : Math.max(0, rawHp)
  let next = setUnit(state, targetId, { block: target.block - blockSpent, hp: nextHp, revive: revived ? revives - 1 : target.revive })
  next = emit(next, { kind: "damage", targetId, amount: remaining, absorbed: totalAbsorb, fell: nextHp <= 0, revived })
  // Retreat Step round (Movement PRD §4.4): "kun yksikkö menettää
  // tietyn määrän HP:tä" - a `wary` unit that just lost a SIGNIFICANT
  // chunk of its own max HP in this one hit (>=25%, a reasoned,
  // stated threshold - the PRD names no exact number) steps back one
  // tile, away from its own current facing, ONCE per round (the new
  // `retreatStepUsed` flag), UNLESS it's currently Rooted (Stun's own
  // exclusion is a named no-op deferral - this engine has no stun
  // mechanic at all yet). Hooked HERE (not per call site) so every
  // damage source that already funnels through this shared function
  // (attackUnit's direct hits AND Guardian-split shares, castAbility's
  // direct/AoE hits, applyEnemyAoe) inherits it for free - the exact
  // centralization this file's own kill-strength/leech/onDealDamage
  // triggers already rely on. Deliberately NOT routed through
  // moveUnit - no Zone of Control interaction, and facing is left
  // UNCHANGED (a defensive flinch backward, not a repositioning turn).
  // Weakened reactions round: !(target.suppressed > 0) - a suppressed
  // unit can't retreat either, including from the SAME back hit that
  // just granted the suppression (attackUnit applies it to `next`
  // BEFORE calling this function, so `target` here already reflects it).
  const canRetreat =
    target.wary &&
    !revived &&
    nextHp > 0 &&
    remaining >= target.maxHp * RETREAT_STEP_HP_THRESHOLD_PCT &&
    !target.retreatStepUsed &&
    !(target.root > 0) &&
    !(target.suppressed > 0)
  if (canRetreat) {
    const delta = DIR_DELTA[OPPOSITE_DIR[target.facing]]
    const destination = { row: target.pos.row + delta.dRow, col: target.pos.col + delta.dCol }
    const occupied = next.units.some((u) => u.id !== targetId && u.hp > 0 && samePos(u.pos, destination))
    if (isOnBoard(destination, next.grid) && !occupied) {
      next = setUnit(next, targetId, { pos: destination, retreatStepUsed: true })
      next = emit({ ...next, log: [...next.log, `${target.name} reels backward from the blow!`] }, { kind: "reaction", unitId: targetId, label: "Retreat!" })
    }
  }
  return { next, absorbed: blockSpent, armourUsed, remaining, fell: nextHp <= 0, revived }
}

// Shared log-note builder for every applyDamageWithBlock call site - the
// real game's own combined wording ("N blocked, M turned by Bulwark"),
// adapted to this engine's "(absorbed N)" phrasing.
function describeAbsorb(absorbed, armourUsed) {
  const parts = []
  if (absorbed > 0) parts.push(`absorbed ${absorbed}`)
  if (armourUsed > 0) parts.push(`${armourUsed} turned by Bulwark`)
  return parts.length ? ` (${parts.join(", ")})` : ""
}

// Shared log-note builder for a Revive save - the real game's own exact
// wording ("X clings to life at 1 HP!").
function describeRevive(revived, targetName) {
  return revived ? ` ${targetName} clings to life at 1 HP!` : ""
}

// The Brood's real mechanic (effects.js's broodSplit + freeEnemyCells,
// ported into this engine's vocabulary): when a broodSplit-carrying enemy
// dies, if its broodGen hasn't hit maxGen yet, it tears into `count`
// HP-reduced copies of itself at the nearest free cells to where it died.
// The real game's cell search is hard-coded to its fixed 3-column enemy
// zone (rows 0-1, cols 0-2, "~6 cells"); this engine's board is much
// bigger (7x10) and enemies aren't confined to a zone, so this generalizes
// it to scan the WHOLE board for the nearest free cells - same
// distance-sort logic, just not artificially bounded to a fixed region.
function freeCellsNear(state, origin, count) {
  const occupied = new Set(state.units.filter((u) => u.hp > 0).map((u) => `${u.pos.row},${u.pos.col}`))
  const cells = []
  for (let row = 0; row < state.grid.rows; row++) {
    for (let col = 0; col < state.grid.cols; col++) {
      if (!occupied.has(`${row},${col}`)) cells.push({ row, col })
    }
  }
  cells.sort((a, b) => {
    const da = chebyshevDist(origin, a)
    const db = chebyshevDist(origin, b)
    if (da !== db) return da - db
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })
  return cells.slice(0, count)
}

// Reuses deriveTacticsUnit to build every hatchling - the exact same
// derivation every normal enemy gets (move/range/attack all computed
// fresh from the real def, not inherited from the parent's possibly-stale
// values), with hp/maxHp overridden to the reduced value and broodGen
// bumped. Because the hatchling is derived from the SAME defId, it still
// carries the real broodSplit field - the broodGen >= maxGen guard on its
// OWN future death is what actually stops the cascade (mirrors the real
// game's maxGen check exactly, no separate "can't re-split" flag needed).
function trySpawnBrood(state, victimId) {
  const victim = getUnit(state, victimId)
  if (!victim || victim.hp > 0 || !victim.broodSplit) return state
  const { count, hpFactor, maxGen } = victim.broodSplit
  if ((victim.broodGen || 0) >= maxGen) return state
  const hp = Math.max(1, Math.round(victim.maxHp * hpFactor))
  const cells = freeCellsNear(state, victim.pos, count)
  let next = state
  cells.forEach((pos, i) => {
    const uid = `${victim.id}-b${i}-${next.units.length}`
    const hatchling = {
      ...deriveTacticsUnit(victim.defId, "enemy", pos, uid),
      hp,
      maxHp: hp,
      broodGen: (victim.broodGen || 0) + 1,
    }
    next = { ...next, units: [...next.units, hatchling], log: [...next.log, `${hatchling.name} tears free of the husk.`] }
  })
  return next
}

// The Collectors' "something worth stealing" - a permanent +1 attack for
// every player unit that lands a killing blow, reusing the SAME `fell`
// flag Brood's spawn hook already reads. This is deliberately generic
// (not gated on which formation is live): every fight in this prototype
// now has a small earned "my squad hits harder as it clears the field"
// arc, and it's the exact `attack`-above-`baseAttack` shape the Coven
// round's `▲{delta}` badge already renders for ANY unit, player or
// enemy, with zero UI changes needed here.
function grantStrengthOnKill(state, actorId, fell) {
  if (!fell) return state
  const actor = getUnit(state, actorId)
  const next = setUnit(state, actorId, { attack: actor.attack + 1 })
  return { ...next, log: [...next.log, `${actor.name} grows stronger.`] }
}

// The Collectors' real mechanic (effects.js's own leech(), ported into
// this engine's vocabulary): a landed hit (remaining > 0 - the real
// game's onDealDamage fires only on `overflow > 0`, never on a fully
// blocked swing) steals exactly 1 point of the target's EARNED attack
// bonus (the same attack-above-baseAttack Strength the kill-grant above
// creates) and hands it to the thief - never below the target's real
// baseAttack, matching the real LEECHABLE_IDS check's "nothing worth
// taking" floor exactly. Deliberately targets `attack`, not Block: a hit
// that overflows Block has already driven the target's Block to 0
// within that SAME hit's own absorb-then-deplete math, so there would
// never be anything left to steal there - `attack` is untouched by that
// math, the correct analog to the real game's Strength/Bulwark/Ward/
// Regen/Evade stacks (all independent of the hit's own Block outcome).
function applyLeechOnHit(state, thiefId, targetId, remaining) {
  if (remaining <= 0) return state
  const thief = getUnit(state, thiefId)
  if (!thief.leech) return state
  const target = getUnit(state, targetId)
  if (!(target.attack > target.baseAttack)) {
    return { ...state, log: [...state.log, `${thief.name} finds nothing worth taking.`] }
  }
  let next = setUnit(state, targetId, { attack: target.attack - 1 })
  next = setUnit(next, thiefId, { attack: thief.attack + 1 })
  return { ...next, log: [...next.log, `${thief.name} takes a stack of Strength from ${target.name}.`] }
}

// Boss/elite phases round: the real HP-gated escalation every elite/
// miniboss/the boss uses (autoBattleEngine.js's checkBossPhases, read
// directly - same shape, ported here). Checked right after a hit lands,
// the same spot trySpawnBrood/grantStrengthOnKill/applyLeechOnHit already
// hook in, before checkTacticsBattleEnd. `phaseIndex` only ever
// increments, and only the NEXT unfired phase is ever checked, so a
// phase can never fire twice or out of order. Phases only ever buff/heal
// in every real def read for this round - never lethal - so no extra
// checkTacticsBattleEnd call is needed here.
function checkEnemyPhase(state, unitId) {
  const unit = getUnit(state, unitId)
  if (!unit || unit.side !== "enemy" || unit.hp <= 0) return state
  const phase = unit.phases?.[unit.phaseIndex]
  if (!phase) return state
  if (unit.hp / unit.maxHp > phase.atHpPct) return state
  let next = { ...state, log: [...state.log, phase.announce] }
  for (const effect of phase.effects || []) {
    next = effect.type === "addTrigger"
      ? setUnit(next, unitId, { triggers: [...getUnit(next, unitId).triggers, { trigger: effect.trigger, effect: effect.effect }] })
      : applyPortableEffect(next, unitId, effect)
  }
  return setUnit(next, unitId, { phaseIndex: unit.phaseIndex + 1 })
}

// The Gorging Maw's real lifelink (addTrigger onDealDamage -> heal 4) -
// the onDealDamage trigger TYPE PR #464 registered but never fired (only
// turnStart was wired that round). Fires an actor's own onDealDamage
// triggers right where checkEnemyPhase/trySpawnBrood already hook in,
// gated on `remaining > 0` - the exact real `overflow > 0` gate
// effects.js's own dealDamage uses before it runs ANY onHit/onDealDamage
// trigger (a fully-blocked swing never fires one), the same value
// applyLeechOnHit already gates on here. A trigger's own effect can
// target itself (the default) or, via `effect.target === "target"`, the
// unit it just hit - the final boss's own real phase-1 effect already
// carries this shape (a Weak debuff landing on whoever he damages, not
// on himself) - resolved here, then handed to the same shared
// applyPortableEffect every other portable effect already goes through.
function checkOnDealDamageTriggers(state, actorId, targetId, remaining) {
  const actor = getUnit(state, actorId)
  // Squad Passive round: widened from enemy-only (every onDealDamage
  // trigger used to come from an enemy's own passive) - the rest of
  // this function was already fully side-agnostic (recipientId/
  // recipient logic doesn't care which side owns the trigger), so this
  // is the entire change needed to let Tommy's real Weak-on-hit
  // squadPassive trigger fire too. Since this already runs
  // unconditionally inside attackUnit, it correctly fires for a Haste
  // follow-up hit as well (PR #483's own recursive attackUnit call).
  if (!actor || remaining <= 0) return state
  let next = state
  for (const t of actor.triggers || []) {
    if (t.trigger !== "onDealDamage") continue
    const recipientId = t.effect.target === "target" ? targetId : actorId
    const recipient = getUnit(next, recipientId)
    if (!recipient || recipient.hp <= 0) continue
    next = applyPortableEffect(next, recipientId, t.effect)
    const onTargetNote = recipientId === targetId ? ` on ${recipient.name}` : ""
    const sourceNote = t.source ? ` (${t.source})` : ""
    next = { ...next, log: [...next.log, `${actor.name} ${describePortableEffect(t.effect)}${onTargetNote}${sourceNote}.`] }
    next = relicFx.spreadSpores(relicFx.noteTrigger(next, actorId, t), actorId, targetId, t.effect)
  }
  return next
}

// Guardian's Intercept (Movement PRD §4.4): "Kun liittolainen joutuu
// hyökkäyksen kohteeksi: Guardian siirtyy liittolaisen eteen; ottaa
// osan vahingosta" - when an ally is attacked, a Guardian takes PART
// of the damage. `className === "Guardian"` is class-locked (only
// grove-warden carries it today, the same "portable trait, only
// reachable by whoever has it" precedent Haste already established) -
// deliberately narrower than the whole "resist" class family from the
// per-class Facing round. MVP scope: the Guardian must already be
// standing adjacent (no repositioning/pathfinding this round - "moves
// in front" is stood in for by "already positioned as protector").
// Spends the Guardian's own real `ap` (not a new Reaction Slot
// resource) - since ap resets to apMax every player turn regardless of
// what it was spent on, this creates a real trade-off (hold the
// Guardian back to guarantee it can intercept) with zero new state.
function eligibleGuardian(state, target) {
  return state.units.find(
    (u) =>
      u.side === target.side &&
      u.id !== target.id &&
      u.hp > 0 &&
      u.className === "Guardian" &&
      u.ap >= 1 &&
      kingAdjacent(u.pos, target.pos) &&
      // Weakened reactions round: a suppressed Guardian can't intercept.
      !(u.suppressed > 0),
  )
}

// Spirit Shift (Movement PRD §4.4): "Spiritwalker voi vaihtaa paikkaa
// lähellä olevan hengen kanssa." A spiritbound unit attacked during the
// OTHER side's own phase (so never a Zone of Control reaction strike on
// its own move) swaps places with the nearest living allied spirit
// within SPIRIT_SHIFT_RANGE, and the spirit takes the blow in its place.
// Deterministic, unlike Sidestep's coinflip - the cost is the spirit's
// own HP, and it's once per round (same boolean Slot shape as Sidestep).
// "lähellä" has no PRD number - 2 tiles is my own stated design call,
// wide enough to matter, close enough that positioning still counts.
const SPIRIT_SHIFT_RANGE = 2

function eligibleSpirit(state, target) {
  if (!target.spiritbound || target.spiritShiftUsed || target.suppressed > 0) return null
  if (state.phase === target.side) return null
  const spirits = state.units.filter(
    (u) => u.side === target.side && u.id !== target.id && u.hp > 0 && u.isSpirit && chebyshevDist(u.pos, target.pos) <= SPIRIT_SHIFT_RANGE,
  )
  spirits.sort((a, b) => chebyshevDist(a.pos, target.pos) - chebyshevDist(b.pos, target.pos))
  return spirits[0] || null
}

export function attackUnit(state, actorId, targetId, opts = {}) {
  const actor = getUnit(state, actorId)
  let target = getUnit(state, targetId)
  if (!actor || !target || actor.hp <= 0 || target.hp <= 0) return state
  if (actor.side === target.side) return state
  // Zone of Control round: a reaction attack (opts.isReaction) skips
  // every gate that only makes sense for a NORMAL action - it costs no
  // AP, fires during the OTHER side's own move/phase, and by
  // definition the reactor is no longer in range of the target's NEW
  // position (that's the whole point of a reaction) - only the
  // same-side guard above still applies unconditionally, since a
  // reaction can never hit an ally either.
  if (!opts.isReaction) {
    if (actor.ap < 1) return state
    if (state.phase !== actor.side) return state
    if (chebyshevDist(actor.pos, target.pos) > actor.range) return state
  }
  let next = opts.isReaction ? state : setUnit(state, actorId, { ap: actor.ap - 1 })
  next = emit(next, { kind: "strike", actorId, targetId, ranged: actor.range > 1, reaction: !!opts.isReaction })
  // Spirit Shift round: resolved FIRST, before Sidestep/facing/damage -
  // the swap changes WHO is hit, so every later step (facing, Guardian,
  // Retreat Step, poison) then runs against the spirit naturally.
  const spirit = eligibleSpirit(next, target)
  if (spirit) {
    next = setUnit(next, targetId, { pos: spirit.pos, spiritShiftUsed: true })
    next = setUnit(next, spirit.id, { pos: target.pos })
    next = { ...next, log: [...next.log, `${target.name} shifts places with ${spirit.name} - the spirit takes the blow!`] }
    next = emit(next, { kind: "reaction", unitId: targetId, label: "Spirit Shift!" })
    targetId = spirit.id
    target = getUnit(next, targetId)
  }
  // Sidestep round (Movement PRD's own §4.4, "kun vihollinen käyttää
  // kaukohyökkäystä"): resolved BEFORE facing/damage are computed for
  // THIS SAME attack, so a genuine reposition can change whether the
  // attack lands as front/side/back below - not a later narration-only
  // step. `actor.range > 1` is a ranged attack (rangeFromAttackPattern's
  // own only 2 outcomes). Weakened reactions' own suppressed status
  // extends to this new 4th reaction too, same as the other 3.
  let sidestepNote = ""
  if (actor.range > 1 && target.nimble && !target.sidestepUsed && !(target.suppressed > 0)) {
    const destination = sidestepDestination(next, target)
    if (destination) {
      next = setUnit(next, targetId, { pos: destination, sidestepUsed: true })
      target = getUnit(next, targetId)
      if (deterministicRoll(next.turn, `${targetId}:sidestep`) < SIDESTEP_DODGE_CHANCE) {
        next = { ...next, log: [...next.log, `${target.name} sidesteps out of the way, avoiding ${actor.name}'s attack completely!`] }
        next = emit(next, { kind: "reaction", unitId: targetId, label: "Dodged!" })
        return checkTacticsBattleEnd(next)
      }
      sidestepNote = ` ${target.name} sidesteps but the attack still connects!`
      next = emit(next, { kind: "reaction", unitId: targetId, label: "Sidestep!" })
    }
  }
  // Block-weakening/Crit round: facing is computed HERE, before the
  // damage calc, since a side hit's own Block-weaken is a real state
  // mutation that must land before modifiedAttackAmount/Shatter's own
  // `defender.block > 0` gate reads the target - not just narration
  // math like every prior round's own later re-computation.
  const facing = classifyFacingAttack(actor, target)
  let effectiveTarget = target
  let blockWeakenNote = ""
  if (facing === "side" && target.block > 0) {
    const weakened = Math.floor(target.block / 2)
    next = setUnit(next, targetId, { block: weakened })
    effectiveTarget = { ...target, block: weakened }
    blockWeakenNote = ` ${target.name}'s Block is weakened to ${weakened}!`
  }
  // Weakened reactions round (Facing PRD's own back-hit line,
  // "puolustajan reaktioiden heikennys"): applied BEFORE the damage
  // call, same as Block-weaken above - so THIS SAME hit's own
  // downstream Retreat Step check (inside applyDamageWithBlock,
  // reading target fresh off `next`) already sees the suppression and
  // correctly denies a retreat from the very blow that caused it.
  let suppressedNote = ""
  if (facing === "back") {
    next = setUnit(next, targetId, { suppressed: (target.suppressed || 0) + SUPPRESSED_DURATION })
    suppressedNote = ` ${target.name}'s guard falters, reactions weakened!`
  }
  const rawAmount = modifiedAttackAmount(actor, effectiveTarget, actor.attack)
  const guardian = eligibleGuardian(next, effectiveTarget)
  let remaining, fell, revived, absorbedNote, fellNote, interceptNote = ""
  const extraVictims = []
  if (guardian) {
    const guardianShare = Math.round(rawAmount / 2)
    const targetShare = rawAmount - guardianShare
    const targetHit = applyDamageWithBlock(next, targetId, targetShare)
    next = emit(setUnit(targetHit.next, guardian.id, { ap: guardian.ap - 1 }), { kind: "reaction", unitId: guardian.id, label: "Intercept!" })
    const guardianHit = applyDamageWithBlock(next, guardian.id, guardianShare)
    next = guardianHit.next
    extraVictims.push({ id: guardian.id, remaining: guardianHit.remaining })
    remaining = targetHit.remaining
    fell = targetHit.fell
    revived = targetHit.revived
    absorbedNote = describeAbsorb(targetHit.absorbed, targetHit.armourUsed)
    fellNote = fell ? " It falls." : ""
    interceptNote = ` ${guardian.name} intercepts, taking ${guardianHit.remaining} in its place${guardianHit.fell ? " and falls" : ""}!`
  } else {
    const hit = applyDamageWithBlock(next, targetId, rawAmount)
    next = hit.next
    remaining = hit.remaining
    fell = hit.fell
    revived = hit.revived
    absorbedNote = describeAbsorb(hit.absorbed, hit.armourUsed)
    fellNote = fell ? " It falls." : ""
  }
  // Facing round: narrate a side/back hit the same plain mechanical
  // way every other landed-hit modifier already does - the real
  // applied percentage already includes Crit's own flat bonus, since
  // facingMultiplier computes it in the same formula.
  const facingPct = facing !== "front" ? Math.round((facingMultiplier(actor, effectiveTarget, facing) - 1) * 100) : 0
  const facingNote = facing === "side" ? ` (flanked, +${facingPct}%)` : facing === "back" ? ` (from behind, CRITICAL, +${facingPct}%)` : ""
  next = { ...next, log: [...next.log, `${actor.name} strikes ${target.name} for ${remaining}${facingNote}.${absorbedNote}${fellNote}${describeRevive(revived, target.name)}${interceptNote}${blockWeakenNote}${suppressedNote}${sidestepNote}`] }
  // The Rot's real mechanic: a poison-carrying enemy applies its stack on
  // EVERY landed hit, unconditional of how much Block absorbed that
  // hit's damage - the real game's debuff step is its own move in the
  // sequence, entirely independent of the accompanying attack step's
  // Block interaction. Only while the target is still standing.
  if (actor.side === "enemy" && actor.poisonOnHit > 0 && !fell) {
    const poisoned = getUnit(next, targetId)
    next = setUnit(next, targetId, { poison: (poisoned.poison || 0) + actor.poisonOnHit })
    next = { ...next, log: [...next.log, `${target.name} is poisoned (+${actor.poisonOnHit}).`] }
  }
  if (actor.side === "player") next = grantStrengthOnKill(next, actorId, fell)
  if (actor.side === "enemy") next = applyLeechOnHit(next, actorId, targetId, remaining)
  next = checkEnemyPhase(next, targetId)
  next = checkOnDealDamageTriggers(next, actorId, targetId, remaining)
  if (fell) next = trySpawnBrood(next, targetId)
  next = relicFx.relicAfterHit(next, actorId, targetId, remaining, fell, extraVictims)
  next = checkTacticsBattleEnd(next)
  // Haste (autoBattleEngine.js's own actSide): a structurally different
  // kind of "more damage" than Strength/Execute - the WHOLE action
  // repeats a second time this same turn, not a bigger single hit.
  // Ported faithfully: gated to a single-target attacker (this engine's
  // own range === 1 IS that distinction - rangeFromAttackPattern's only
  // two outcomes), fires only from a genuine attack action (never
  // castAbility/moveUnit - this IS that "acting.intent.type===attack"
  // moment), costs no extra AP (refunded here, then spent again by the
  // follow-up's own attackUnit call), and re-resolves targeting fresh
  // via attackableTargets so a first hit that just killed its target
  // doesn't waste the second swing on a corpse - keeping the same
  // target if it's still alive and in range (the unit hasn't moved
  // between its two swings), else falling back to whichever valid
  // target remains. `opts.isHasteFollowUp` guards the follow-up hit
  // from triggering a third, matching the real mechanic's own "doesn't
  // itself trigger Chain again" restraint.
  //
  // Zone of Control round: the guard below used to hardcode
  // `next.phase === "player"` - confirmed equivalent, for every call
  // site that existed before this round, to simply "the battle hasn't
  // ended" (a normal player attack only ever left `phase` at "player"
  // or flipped it to "won"/"lost"). Generalized to check that
  // directly, since a REACTION can now fire a player unit's own
  // Haste-carrying attack DURING the enemy's own phase (an enemy
  // disengaging from a player triggers the player's own zone) - the
  // old hardcoded check would have wrongly swallowed that follow-up.
  if (!opts.isHasteFollowUp && actor.side === "player" && actor.haste && actor.range === 1 && next.phase !== "won" && next.phase !== "lost") {
    const reActor = getUnit(next, actorId)
    if (reActor && reActor.hp > 0) {
      const targets = attackableTargets(next, actorId)
      if (targets.length) {
        const followTargetId = targets.some((t) => t.id === targetId) ? targetId : targets[0].id
        next = { ...next, log: [...next.log, `${actor.name}'s Haste fires - a second strike!`] }
        // Zone of Control round: the refund only makes sense for a
        // NORMAL primary attack, which really did spend 1 AP above -
        // a reaction's own primary hit never touched AP at all (see
        // the isReaction branch above), so refunding here would
        // permanently inflate a Haste-carrying reactor's AP by 1 every
        // time it reacts.
        const refunded = opts.isReaction ? next : setUnit(next, actorId, { ap: reActor.ap + 1 })
        next = attackUnit(refunded, actorId, followTargetId, { isHasteFollowUp: true, isReaction: opts.isReaction })
      }
    }
  }
  return next
}

// castAbility(state, actorId, targetId?) - the 3 kinds of ability an
// acting player unit can spend AP on instead of a plain Move/Attack.
export function castAbility(state, actorId, targetId) {
  const actor = getUnit(state, actorId)
  if (!actor || actor.hp <= 0 || !actor.ability) return state
  if (state.phase !== actor.side) return state
  const ability = actor.ability
  if (actor.ap < ability.cost || actor.cooldownRemaining > 0) return state

  if (ability.kind === "aura-block") {
    let next = setUnit(state, actorId, { ap: actor.ap - ability.cost, cooldownRemaining: ability.cooldown })
    const recipients = state.units.filter(
      (u) => u.hp > 0 && u.side === actor.side && (u.id === actorId || kingAdjacent(u.pos, actor.pos)),
    )
    for (const u of recipients) {
      const live = getUnit(next, u.id)
      next = setUnit(next, u.id, { block: live.block + ability.amount })
    }
    return emit({ ...next, log: [...next.log, `${actor.name} raises ${ability.name}.`] }, { kind: "reaction", unitId: actorId, label: `${ability.name}!` })
  }

  if (ability.kind === "heal") {
    const target = getUnit(state, targetId)
    if (!target || target.hp <= 0 || target.side !== actor.side) return state
    if (target.id !== actorId && !kingAdjacent(target.pos, actor.pos)) return state
    let next = setUnit(state, actorId, { ap: actor.ap - ability.cost, cooldownRemaining: ability.cooldown })
    const live = getUnit(next, target.id)
    const healedHp = Math.min(live.maxHp, live.hp + ability.amount)
    next = setUnit(next, target.id, { hp: healedHp })
    return emit({ ...next, log: [...next.log, `${actor.name} mends ${target.name} for ${healedHp - live.hp}.`] }, { kind: "heal", actorId, targetId: target.id, amount: healedHp - live.hp })
  }

  if (ability.kind === "burst") {
    const target = getUnit(state, targetId)
    if (!target || target.hp <= 0 || target.side === actor.side) return state
    if (chebyshevDist(actor.pos, target.pos) > actor.range) return state
    // Same real Taunt restriction attackableTargets already enforces for
    // the plain Attack path - a burst is still an attack against the
    // opposing side, so it's bound by the same rule.
    const tauntersOnTargetSide = livingTaunters(state, target.side)
    if (tauntersOnTargetSide.length && !(target.taunt > 0)) return state
    let next = setUnit(state, actorId, { ap: actor.ap - ability.cost, cooldownRemaining: ability.cooldown })
    next = emit(next, { kind: "strike", actorId, targetId: target.id, ranged: actor.range > 1, ability: ability.name })
    const amount = modifiedAttackAmount(actor, target, actor.attack * ability.multiplier)
    const { next: hit, absorbed, armourUsed, remaining, fell, revived } = applyDamageWithBlock(next, target.id, amount)
    next = hit
    const absorbedNote = describeAbsorb(absorbed, armourUsed)
    const fellNote = fell ? " It falls." : ""
    next = { ...next, log: [...next.log, `${actor.name} unleashes ${ability.name} on ${target.name} for ${remaining}!${absorbedNote}${fellNote}${describeRevive(revived, target.name)}`] }
    next = grantStrengthOnKill(next, actorId, fell)
    next = checkEnemyPhase(next, target.id)
    next = checkOnDealDamageTriggers(next, actorId, target.id, remaining)
    if (fell) next = trySpawnBrood(next, target.id)
    return checkTacticsBattleEnd(next)
  }

  // Abilities sprint: the new kinds (see tacticsAbilities.js).
  const side = abilityTargetSide(ability)
  if (side && !abilityTargets(state, actorId).some((u) => u.id === targetId)) return state
  const target = side ? getUnit(state, targetId) : null
  let next = setUnit(state, actorId, { ap: actor.ap - ability.cost, cooldownRemaining: ability.cooldown })
  const callout = (s) => emit(s, { kind: "reaction", unitId: actorId, label: `${ability.name}!` })

  if (ability.kind === "taunt-shout") {
    next = setUnit(next, actorId, { shoutTurn: state.turn, block: actor.block + ability.amount })
    return callout({ ...next, log: [...next.log, `${actor.name} bellows ${ability.name} - every nearby foe must face it! (+${ability.amount} Block)`] })
  }

  if (ability.kind === "rally") {
    for (const u of state.units) {
      if (u.hp <= 0 || u.side !== actor.side || !(u.id === actorId || kingAdjacent(u.pos, actor.pos))) continue
      next = setUnit(next, u.id, { attack: getUnit(next, u.id).attack + ability.amount })
    }
    return callout({ ...next, log: [...next.log, `${actor.name} calls ${ability.name} - nearby allies grow stronger (+${ability.amount}).`] })
  }

  if (ability.kind === "shield-ally") {
    const live = getUnit(next, target.id)
    next = setUnit(next, target.id, { ward: (live.ward || 0) + 1, block: live.block + ability.amount })
    next = emit(next, { kind: "ward", targetId: target.id })
    return callout({ ...next, log: [...next.log, `${actor.name} shields ${target.name} with ${ability.name} (Ward, +${ability.amount} Block).`] })
  }

  if (ability.kind === "dash") {
    const landing = dashLanding(state, actor, target)
    if (!landing.stay) {
      const facing = cardinalDir(landing.pos.col - actor.pos.col, landing.pos.row - actor.pos.row)
      next = setUnit(next, actorId, { pos: landing.pos, facing })
      const grant = TERRAIN[terrainAt(next, landing.pos)].grantPoison
      if (grant) next = setUnit(next, actorId, { poison: (getUnit(next, actorId).poison || 0) + grant })
      next = { ...next, log: [...next.log, `${actor.name} dashes past the enemy lines!`] }
    }
    next = callout(next)
    next = abilityHit(next, actorId, target.id, getUnit(next, actorId).attack + ability.bonus, ability).next
    return checkTacticsBattleEnd(next)
  }

  if (ability.kind === "cleave") {
    const splashIds = livingUnits(state, target.side).filter((u) => u.id !== target.id && kingAdjacent(u.pos, target.pos)).map((u) => u.id)
    next = callout(next)
    next = abilityHit(next, actorId, target.id, actor.attack, ability).next
    for (const id of splashIds) {
      if (next.phase === "won" || next.phase === "lost") break
      const splashTarget = getUnit(next, id)
      if (splashTarget && splashTarget.hp > 0) next = abilityHit(next, actorId, id, Math.ceil(actor.attack / 2), ability).next
    }
    return checkTacticsBattleEnd(next)
  }

  if (ability.kind === "poison-strike" || ability.kind === "root-shot") {
    next = callout(next)
    const { next: hit, fell } = abilityHit(next, actorId, target.id, actor.attack, ability)
    next = hit
    if (!fell) {
      const live = getUnit(next, target.id)
      if (ability.kind === "poison-strike") {
        next = setUnit(next, target.id, { poison: (live.poison || 0) + ability.amount })
        next = { ...next, log: [...next.log, `${target.name} is poisoned (+${ability.amount}).`] }
      } else {
        next = setUnit(next, target.id, { root: (live.root || 0) + ROOT_DURATION })
        next = { ...next, log: [...next.log, `${target.name} is rooted in place!`] }
      }
      next = emit(next, { kind: "reaction", unitId: target.id, label: ability.kind === "poison-strike" ? "Poisoned!" : "Rooted!" })
    }
    return checkTacticsBattleEnd(next)
  }

  if (ability.kind === "push") {
    const dRow = Math.sign(target.pos.row - actor.pos.row)
    const dCol = Math.sign(target.pos.col - actor.pos.col)
    const dest = { row: target.pos.row + dRow, col: target.pos.col + dCol }
    const free = isOnBoard(dest, state.grid) && TERRAIN[terrainAt(state, dest)].cost !== Infinity && !state.units.some((u) => u.hp > 0 && samePos(u.pos, dest))
    next = callout(next)
    const { next: hit, fell } = abilityHit(next, actorId, target.id, actor.attack + (free ? 0 : ability.bonus), ability)
    next = hit
    const live = getUnit(next, target.id)
    if (!fell && free && samePos(live.pos, target.pos) && !next.units.some((u) => u.hp > 0 && samePos(u.pos, dest))) {
      next = setUnit(next, target.id, { pos: dest })
      next = emit({ ...next, log: [...next.log, `${target.name} is knocked back!`] }, { kind: "reaction", unitId: target.id, label: "Knocked back!" })
    } else if (!free) {
      next = { ...next, log: [...next.log, `${target.name} slams into what's behind it (+${ability.bonus})!`] }
    }
    return checkTacticsBattleEnd(next)
  }

  return state
}

// One ability hit: same damage pipeline the burst branch uses.
function abilityHit(state, actorId, targetId, baseAmount, ability) {
  const actor = getUnit(state, actorId)
  const target = getUnit(state, targetId)
  let next = emit(state, { kind: "strike", actorId, targetId, ranged: chebyshevDist(actor.pos, target.pos) > 1, ability: ability.name })
  const amount = modifiedAttackAmount(actor, target, baseAmount)
  const { next: hit, absorbed, armourUsed, remaining, fell, revived } = applyDamageWithBlock(next, targetId, amount)
  next = hit
  next = { ...next, log: [...next.log, `${actor.name}'s ${ability.name} hits ${target.name} for ${remaining}!${describeAbsorb(absorbed, armourUsed)}${fell ? " It falls." : ""}${describeRevive(revived, target.name)}`] }
  next = grantStrengthOnKill(next, actorId, fell)
  next = checkEnemyPhase(next, targetId)
  next = checkOnDealDamageTriggers(next, actorId, targetId, remaining)
  if (fell) next = trySpawnBrood(next, targetId)
  return { next, fell }
}

// Dash: a free tile next to the target within `range` of the actor
// (a leap - ignores Zones and path blocking, never water). Stays put if
// already adjacent. null = no landing spot.
function dashLanding(state, actor, target) {
  if (kingAdjacent(actor.pos, target.pos)) return { stay: true, pos: actor.pos }
  if (actor.root > 0) return null
  let best = null
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const pos = { row: target.pos.row + dr, col: target.pos.col + dc }
      if ((dr === 0 && dc === 0) || !isOnBoard(pos, state.grid)) continue
      if (TERRAIN[terrainAt(state, pos)].cost === Infinity) continue
      if (state.units.some((u) => u.hp > 0 && samePos(u.pos, pos))) continue
      const dist = chebyshevDist(actor.pos, pos)
      if (dist > actor.ability.range) continue
      if (!best || dist < best.dist) best = { dist, pos }
    }
  }
  return best ? { stay: false, pos: best.pos } : null
}

// Valid clicked targets for the unit's ability right now (UI + guard).
export function abilityTargets(state, actorId) {
  const actor = getUnit(state, actorId)
  if (!actor || actor.hp <= 0 || !actor.ability) return []
  const side = abilityTargetSide(actor.ability)
  if (side === "ally") return livingUnits(state, actor.side).filter((u) => u.id === actorId || kingAdjacent(u.pos, actor.pos))
  if (side !== "enemy") return []
  if (actor.ability.kind !== "dash") return attackableTargets(state, actorId)
  const foes = livingUnits(state, actor.side === "player" ? "enemy" : "player")
  const taunters = foes.filter((u) => isTaunting(state, u))
  return (taunters.length ? taunters : foes).filter((u) => dashLanding(state, actor, u))
}

// The Ancients archetype's real mechanic (autoBattleEngine.js's own
// applyAncientCharge, ported line-for-line into this engine's vocabulary -
// same log phrasing, same stagger/tick/payoff shape): a slow enemy winds up
// ONE telegraphed hit over `charge.turns` rounds. Runs at the exact point
// the player's turn ends (so a kill or a heavy hit the player JUST landed
// pre-empts this round's tick), mirroring the real timing (between the
// player and enemy phases).
//
// Not ported: the real mechanic's `stun`-holds-the-count branch - this
// engine has no stun/status system yet, a named deferral (see the round's
// plan), not a silent drop. The other three real answers still work as
// designed: killing the charging enemy simply removes it from
// livingUnits, so the tick loop never reaches it; a heavy round of damage
// (>= breakDamage since the last tick) staggers it back to full; and
// bracing with Block/Bulwark Aura already mitigates the payoff for free,
// since it routes through the same applyDamageWithBlock every other
// attack in this engine already uses.
// The Coven's real mechanic (autoBattleEngine.js's own applyCovenTick,
// ported into this engine's vocabulary): a caster behind the front line
// buffs EVERY OTHER living enemy each round - not itself, not adjacency-
// gated. The real game's `applyBuff strength` becomes a flat `attack +=
// amount` here, the same translation `battleStartBonus` already uses for
// the Swarm/Hunters' one-time grants - this is just the per-round version
// of the identical idea. Killing the caster stops it for free: it's
// simply no longer in livingUnits the next time this runs. Narrated every
// round it fires (the exact "don't ship an invisible mechanic" lesson
// from the Ancients' charge-telegraph fix) - the growing attack itself is
// also made visible via the baseAttack snapshot + the UI's badge.
function applyCovenTick(state) {
  let next = state
  for (const caster of livingUnits(state, "enemy")) {
    const aura = caster.covenAura
    if (!aura) continue
    for (const other of livingUnits(next, "enemy")) {
      if (other.id === caster.id) continue
      next = setUnit(next, other.id, { attack: other.attack + aura.amount })
    }
    next = { ...next, log: [...next.log, `${caster.name} empowers the pack.`] }
  }
  return next
}

// The Cult's real mechanic (autoBattleEngine.js's own applyCultTick,
// ported into this engine's vocabulary): a ritual leader periodically
// sacrifices a living cultFodder ally, folding its strength into EVERY
// remaining living enemy - the leader itself INCLUDED this time (unlike
// the Coven's exclude-self model; confirmed by reading the real code's
// buff loop directly, which has no self-exclusion check). Bounded three
// ways, same as the real archetype: only fires while a fodder ally lives
// (this formation has 2, so at most 2 cycles, then it de-escalates
// permanently since nothing regenerates fodder), the fodder is a real
// fighting body (killing it yourself starves the rite, trading focus for
// spread damage), and killing the leader stops it outright.
//
// The real applyCultTick logs nothing on a non-completing tick - it
// builds silently and only reveals itself when it fires. Every other
// per-round mechanic in this engine (the Ancients' chargeCounter, the
// Coven's covenAura) narrates EVERY tick and shows a badge - so this
// round adds a small ☾-badge + a quiet log line on every tick too,
// matching that established pattern instead of reproducing the real
// game's silence (the same "don't ship an invisible mechanic" lesson
// from the last two rounds).
function applyCultTick(state) {
  let next = state
  for (const caster of livingUnits(state, "enemy")) {
    const ritual = caster.cultRitual
    if (!ritual) continue
    const live = getUnit(next, caster.id)
    if (!live || live.hp <= 0) continue
    const charge = live.ritualCharge + 1
    if (charge < ritual.every) {
      next = setUnit(next, caster.id, { ritualCharge: charge })
      next = { ...next, log: [...next.log, `${live.name}'s ritual gathers strength.`] }
      continue
    }
    const fodder = livingUnits(next, "enemy").find((o) => o.id !== caster.id && o.cultFodder)
    if (!fodder) {
      next = setUnit(next, caster.id, { ritualCharge: 0 })
      next = { ...next, log: [...next.log, `${live.name}'s ritual sputters - nothing left to give.`] }
      continue
    }
    next = setUnit(next, fodder.id, { hp: 0 })
    next = { ...next, log: [...next.log, `${live.name} gives ${fodder.name} to the ritual.`] }
    next = checkTacticsBattleEnd(next)
    for (const other of livingUnits(next, "enemy")) {
      next = setUnit(next, other.id, { attack: other.attack + ritual.buff.amount })
    }
    if (ritual.feed) {
      const fed = getUnit(next, caster.id)
      if (fed && fed.hp > 0) next = setUnit(next, caster.id, { hp: Math.min(fed.maxHp, fed.hp + ritual.feed.amount) })
    }
    next = setUnit(next, caster.id, { ritualCharge: 0 })
  }
  return next
}

function applyChargeTick(state) {
  let next = state
  for (const enemy of livingUnits(next, "enemy")) {
    if (!enemy.charge) continue
    const live = getUnit(next, enemy.id)
    if (!live || live.hp <= 0) continue
    const { charge } = live
    if (live.chargeHpMark - live.hp >= charge.breakDamage) {
      next = setUnit(next, enemy.id, { chargeCounter: charge.turns, chargeHpMark: live.hp })
      next = { ...next, log: [...next.log, `${live.name} staggers - the ${charge.label} unravels.`] }
      continue
    }
    const nextCounter = live.chargeCounter - 1
    if (nextCounter > 0) {
      next = setUnit(next, enemy.id, { chargeCounter: nextCounter, chargeHpMark: live.hp })
      next = { ...next, log: [...next.log, `${live.name} draws breath - ${charge.label} in ${nextCounter}.`] }
      continue
    }
    next = { ...next, log: [...next.log, `${live.name} unleashes ${charge.label}!`] }
    const amount = charge.effect.find((e) => e.type === "damage")?.amount || 0
    for (const p of livingUnits(next, "player")) {
      const { next: hit, absorbed, armourUsed, remaining, fell, revived } = applyDamageWithBlock(next, p.id, amount)
      next = hit
      const absorbedNote = describeAbsorb(absorbed, armourUsed)
      const fellNote = fell ? " It falls." : ""
      next = { ...next, log: [...next.log, `${p.name} takes ${remaining}.${absorbedNote}${fellNote}${describeRevive(revived, p.name)}`] }
    }
    next = checkTacticsBattleEnd(next)
    if (next.phase !== "player") return next
    next = setUnit(next, enemy.id, { chargeCounter: charge.turns, chargeHpMark: live.hp })
  }
  return next
}

// The player-facing charge telegraph: will the Ancients' payoff land if
// the player ends their turn right now, and who does it hit. A REAL dry
// run of applyChargeTick on a scratch copy (never the real state) - not a
// second, parallel re-derivation of its stagger/tick/payoff conditions -
// so this can never drift out of sync with what actually happens, the
// exact same discipline previewEnemyIntents uses for the move/attack
// telegraph. Compares player HP before/after to find who got hit (the
// payoff is the only thing in applyChargeTick that ever touches player
// HP), then reads back which charging enemy was one tick from firing.
// Single-charger assumption: today only one enemy per formation ever
// carries `charge`, so "a payoff happened" -> "the enemy at counter 1
// fired it" is unambiguous; a future multi-charger formation would need
// a per-enemy fired/staggered signal instead of this global one.
export function previewChargeThreat(state) {
  if (!state.units.some((u) => u.side === "enemy" && u.hp > 0 && u.charge)) return { enemyIds: [], playerIds: [] }
  const beforeHp = new Map(state.units.filter((u) => u.side === "player").map((u) => [u.id, u.hp]))
  const after = applyChargeTick(state)
  const playerIds = after.units
    .filter((u) => u.side === "player" && beforeHp.has(u.id) && u.hp < beforeHp.get(u.id))
    .map((u) => u.id)
  const enemyIds = playerIds.length
    ? state.units.filter((u) => u.side === "enemy" && u.hp > 0 && u.charge && u.chargeCounter === 1).map((u) => u.id)
    : []
  return { enemyIds, playerIds }
}

// The Rot's real formation synergy ("The rot won't quit" - a flat
// `turnStart -> heal 1` to every living piece each round, confirmed by
// reading formations.js directly): the exact same per-round formation-
// identity-gated tick SHAPE applyCovenTick/applyCultTick/applyChargeTick
// already use, just healing instead of buffing. Never touches hp
// downward, so - like applyCovenTick - it can never end the battle and
// needs no phase guard.
function applyRotMendTick(state) {
  const amount = ENEMY_FORMATIONS[state.formationId]?.selfMend || 0
  if (!amount) return state
  let next = state
  for (const enemy of livingUnits(state, "enemy")) {
    const live = getUnit(next, enemy.id)
    if (!live || live.hp <= 0 || live.hp >= live.maxHp) continue
    const healedHp = Math.min(live.maxHp, live.hp + amount)
    next = setUnit(next, enemy.id, { hp: healedHp })
    next = { ...next, log: [...next.log, `${live.name} knits itself back together for ${healedHp - live.hp}.`] }
  }
  return next
}

// Boss/elite phases round: fires every living enemy's own `turnStart`
// triggers (registered from its real `passive` array, or added mid-fight
// by a fired phase - see checkEnemyPhase above) - the exact same per-
// round-tick SHAPE applyCovenTick/applyCultTick/applyRotMendTick already
// use, generalized from "one formation-level mechanic" to "whatever this
// specific unit's own real def registered." Called AFTER the fortressBlock
// reset below (not before), so a trigger's own Block grant lands on top
// of a formation's flat amount rather than being overwritten by it -
// the same "resets then re-applies" ordering the Fortress's own comment
// already establishes, just for a per-unit source instead of a per-
// formation one. Only `turnStart` is ever fired here - `onDealDamage`/
// `onHit` triggers are collected (checkEnemyPhase's addTrigger branch,
// the passive parse above) but stay inert this round, since no currently
// -ported real content needs them yet (a named, stated deferral).
function describePortableEffect(effect) {
  if (effect.type === "applyBuff" && effect.id === "strength") return "grows stronger"
  if (effect.type === "applyBuff" && effect.id === "weak") return "leaves the wound raw"
  if (effect.type === "applyBuff" && effect.id === "bulwark") return "hardens its armour"
  if (effect.type === "applyBuff" && effect.id === "vulnerable") return "leaves the target exposed"
  if (effect.type === "block") return "braces for the next blow"
  if (effect.type === "heal") return "steadies itself"
  return relicFx.describeRelicEffect(effect) || "stirs"
}

// Squad Passive round: generalized from enemy-only
// (applyEnemyTurnStartTriggers) - Deepwarden's own post-phase Block
// trigger was the only turnStart trigger owner until now, always on
// the enemy side. Tommy's real squadPassive gives every PLAYER unit a
// turnStart Block trigger too, so this needs a `side` param and a
// symmetric call site (runEnemyTurn's own return-to-player block,
// right after Block already resets to 0 there - same "reset then
// re-grant" ordering this function already established for the enemy
// side inside endPlayerTurn).
function applyTurnStartTriggers(state, side) {
  let next = state
  for (const unit of livingUnits(state, side)) {
    for (const t of unit.triggers || []) {
      if (t.trigger !== "turnStart") continue
      const live = getUnit(next, unit.id)
      if (!live || live.hp <= 0) continue
      next = applyPortableEffect(next, unit.id, t.effect)
      next = { ...next, log: [...next.log, `${live.name} ${describePortableEffect(t.effect)}${t.source ? ` (${t.source})` : ""}.`] }
      next = relicFx.noteTrigger(next, unit.id, t)
    }
  }
  return next
}

// Everything between "End Turn" and the first enemy acting (ticks, resets).
// Shared with previewEnemyIntents so the telegraph is an exact dry-run.
function enemyPhaseStart(state) {
  // applyCovenTick and applyRotMendTick never touch hp downward, so
  // neither can end the battle - no phase guard needed for either,
  // unlike the two ticks below.
  const covened = applyCovenTick(relicFx.relicTurnEnd(state, "player"))
  const mended = applyRotMendTick(covened)
  const cultTicked = applyCultTick(mended)
  if (cultTicked.phase !== "player") return cultTicked
  const ticked = applyChargeTick(cultTicked)
  if (ticked.phase !== "player") return ticked
  // Enemy AP resets here (symmetry/future-proofing - enemies still just
  // move/attack every turn this round, so this is mostly inert today).
  // The Fortress's real synergy ("The wall holds firm" - a flat +3 Block
  // every round) is granted here too: this is the start of the enemy's
  // own round, so the Block is live to absorb the PLAYER's attacks on
  // their NEXT turn. Nothing else ever grants enemy Block, so a flat
  // overwrite to the formation's fixed amount already IS "resets then
  // re-applies this round's grant" - the real mechanic, no separate reset.
  const fortressBlock = ENEMY_FORMATIONS[state.formationId]?.fortressBlock || 0
  // Frost Zone round: enemy-side `slow` decays right here - the exact
  // same "start of that side's own turn" checkpoint cooldownRemaining
  // already uses for the player side below (`returnedToPlayer`). The
  // `|| 0` guard is required (not optional): every pre-existing
  // hand-built synthetic test unit lacks a `slow` field entirely, and
  // `undefined - 1` is `NaN` without it - the exact already-logged
  // Poison-round gotcha.
  const resetForEnemyPhase = {
    ...ticked,
    phase: "enemy",
    // Thorn Zone round: enemy-side `root` decays alongside `slow` at
    // this same checkpoint - the exact same mechanism, same `|| 0`
    // guard requirement. Retreat Step round: `retreatStepUsed` resets
    // here too - a plain boolean, no `|| 0` needed. Weakened reactions
    // round: `suppressed` decays the same way as `slow`/`root`.
    units: ticked.units.map((u) =>
      u.side === "enemy"
        ? {
            ...tickSkillCds(u),
            ap: u.apMax,
            block: fortressBlock,
            slow: Math.max(0, (u.slow || 0) - 1),
            root: Math.max(0, (u.root || 0) - 1),
            retreatStepUsed: false,
            sidestepUsed: false,
            spiritShiftUsed: false,
            suppressed: Math.max(0, (u.suppressed || 0) - 1),
          }
        : u,
    ),
    log: [...ticked.log, "Enemy turn."],
  }
  // Regen ticks (heals whatever stack SURVIVED the player's turn, then
  // decays it) BEFORE applyTurnStartTriggers grants this round's
  // FRESH stack - the exact real order (effects.js's own tickRegen fires
  // at the very top of the real round, well before a unit's own
  // turnStart trigger re-grants it later that same round) - so a
  // freshly-granted stack never heals the same turn it was granted,
  // only the FOLLOWING one. Getting this backwards is the same class of
  // bug the Rot round's own poison-timing fix already caught once.
  const regenTicked = applyRegenTick(resetForEnemyPhase)
  // A unit's own turnStart trigger (Deepwarden's post-phase "the ground
  // answers" Block, etc.) is applied AFTER the flat fortressBlock reset
  // above, never before - that reset is a per-unit overwrite, not an
  // add, so a trigger firing first would just be wiped by it.
  // Relic ticks on enemies (poison/burn) can end the fight here.
  const relicTicked = relicFx.relicTurnStart(regenTicked, "enemy")
  if (relicTicked.phase !== "enemy") return relicTicked
  const next = applyTurnStartTriggers(relicTicked, "enemy")
  // Objective: the Totem pulses at the top of the enemy phase - inside
  // enemyPhaseStart so previewEnemyIntents sees the same pulsed state.
  return objectiveEnemyPhaseStart(next)
}

export function endPlayerTurn(state) {
  if (state.phase !== "player") return state
  const next = enemyPhaseStart(state)
  return next.phase === "enemy" ? runEnemyTurn(next) : next
}

// Enemy AI (smarter-enemies sprint): every option - stay or any reachable
// tile, attacking any valid target from there or just approaching - is
// scored and the best one wins. Pure and deterministic (strict `>` keeps
// the first of equal options), so previewEnemyIntents stays an exact
// dry-run. Scoring prefers kills, low HP%, squishy/high-damage targets and
// the Commander; melee favor side/back tiles; ranged keep their distance;
// everyone avoids poison and zone traps; bosses weigh how exposed a tile is.
//
// Split into a pure decision (decideEnemyIntent) and a mutation that acts
// on that decision (applyEnemyIntent) so BOTH the real enemy turn AND the
// player-facing intent telegraph (previewEnemyIntents, below) run through
// the exact same logic.
const AI_ATTACK_BASE = 200
const AI_KILL_BONUS = 1000
const AI_COMMANDER_BONUS = 40
const AI_POISON_PENALTY = 60
const AI_ZONE_STATUS_PENALTY = 20
const AI_FACING_BONUS = { front: 0, side: 4, back: 8 }

// Bosses/elites with phases or the squad-wide strike play more carefully.
function isCautiousEnemy(unit) {
  return (unit.phases?.length || 0) > 0 || !!unit.aoeMove
}

// Mirrors attackableTargets' Taunt filter for a hypothetical tile.
function aiTargetsFrom(state, enemy, pos) {
  const pool = livingUnits(state, "player").filter((u) => chebyshevDist(pos, u.pos) <= enemy.range)
  const taunters = livingTaunters(state, "player")
  return taunters.length ? pool.filter((u) => u.taunt > 0) : pool
}

// Rough damage after Ward/Block/Bulwark - the same modifier chain a real hit uses.
function aiEstimateHit(attacker, target) {
  if (target.ward > 0) return 0
  const raw = modifiedAttackAmount(attacker, target, attacker.attack)
  return Math.max(0, raw - (target.block || 0) - (target.bulwark || 0))
}

// How much a target is worth hitting, kill aside.
function aiTargetValue(target) {
  let value = 30 * (1 - target.hp / target.maxHp) + 2 * target.attack
  value += Math.max(0, 40 - target.maxHp) * 0.5
  if (target.range > 1) value += 8
  if (target.id === "player-commander") value += AI_COMMANDER_BONUS
  return value
}

// Predicts what moveUnit would do to the mover (AP toll, reaction hits,
// hazards) without running it.
function aiMoveOutcome(state, enemy, dest) {
  if (samePos(dest, enemy.pos)) return { apLeft: enemy.ap, reactionDmg: 0, hazard: 0 }
  const opp = "player"
  const toll = insideAnyOpposingZone(state, enemy.pos, opp) && !insideAnyOpposingZone(state, dest, opp) ? ZONE_LEAVE_AP_TOLL : 0
  const moved = { ...enemy, pos: dest, facing: cardinalDir(dest.col - enemy.pos.col, dest.row - enemy.pos.row) }
  const reactionDmg = zocControllers(state, enemy.pos, opp)
    .filter((c) => !kingAdjacent(c.pos, dest) && !(c.suppressed > 0))
    .reduce((sum, c) => sum + aiEstimateHit(c, moved), 0)
  let hazard = 0
  if (TERRAIN[terrainAt(state, dest)].grantPoison) hazard += AI_POISON_PENALTY
  if (fearZoneControllers(state, dest, opp).length && !fearZoneControllers(state, enemy.pos, opp).length) hazard += AI_ZONE_STATUS_PENALTY
  if (thornZoneControllers(state, dest, opp).length && !thornZoneControllers(state, enemy.pos, opp).length) hazard += AI_ZONE_STATUS_PENALTY
  if (frostZoneControllers(state, enemy.pos, opp).length && !frostZoneControllers(state, dest, opp).length) hazard += AI_ZONE_STATUS_PENALTY
  return { apLeft: Math.max(0, enemy.ap - 1 - toll), reactionDmg, hazard }
}

function aiAdjacentPlayerMelee(state, pos) {
  return livingUnits(state, "player").filter((u) => u.range === 1 && chebyshevDist(u.pos, pos) <= 1)
}

// Player units that could reach and hit `pos` next turn.
function aiExposure(state, pos) {
  return livingUnits(state, "player").filter((u) => chebyshevDist(u.pos, pos) <= effectiveMove(u) + u.range).length
}

// Positional part of an option's score; null = never go there.
function aiTileScore(state, enemy, pos, outcome) {
  if (outcome.reactionDmg >= enemy.hp) return null
  let score = -outcome.hazard - outcome.reactionDmg * 3
  if (!samePos(pos, enemy.pos)) score -= 1
  if (enemy.range > 1) score -= 25 * aiAdjacentPlayerMelee(state, pos).length
  if (isCautiousEnemy(enemy)) score -= 6 * aiExposure(state, pos)
  return score
}

// Best retreat tile for a ranged enemy after it has already attacked.
function aiRetreatTile(state, enemyId) {
  const enemy = getUnit(state, enemyId)
  if (!enemy || enemy.hp <= 0 || enemy.ap < 1) return null
  const players = livingUnits(state, "player")
  if (!players.length) return null
  const spacing = (pos) => Math.min(enemy.range, ...players.map((p) => chebyshevDist(pos, p.pos)))
  const scoreOf = (pos) => {
    const tile = aiTileScore(state, enemy, pos, aiMoveOutcome(state, enemy, pos))
    return tile === null ? null : tile + 3 * spacing(pos)
  }
  let best = null
  let bestScore = scoreOf(enemy.pos)
  for (const pos of reachableTilesFor(state, enemyId)) {
    const score = scoreOf(pos)
    if (score !== null && score > bestScore) {
      best = pos
      bestScore = score
    }
  }
  return best
}

// ===== Enemy skills (sprint 2) ===========================================
// Kits come from tacticsEnemyAbilities.js; scored alongside attacks in
// decideEnemyIntent and applied in applyEnemyIntent, so the intent preview
// stays an exact dry-run. Slam is a 2-step telegraph: wind up (3x3 tiles
// marked) -> crush those tiles on the enemy's next turn.
const SUMMON_ENEMY_CAP = 8

function skillReady(unit, skill) {
  return !((unit.skillCd || {})[skill.id] > 0)
}

// Cooldowns tick at the start of each enemy phase.
function tickSkillCds(unit) {
  if (!unit.skillCd) return unit
  const skillCd = {}
  for (const [k, v] of Object.entries(unit.skillCd)) skillCd[k] = Math.max(0, v - 1)
  return { ...unit, skillCd }
}

function startSkillCd(state, unitId, skill) {
  const u = getUnit(state, unitId)
  return setUnit(state, unitId, { skillCd: { ...(u.skillCd || {}), [skill.id]: skill.cooldown } })
}

function skillIntentBase(skill) {
  return { kind: "skill", skillId: skill.id, skillKind: skill.kind, name: skill.name, icon: ENEMY_SKILL_KINDS[skill.kind].icon }
}

function slamTiles(state, center) {
  const tiles = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const pos = { row: center.row + dr, col: center.col + dc }
      if (isOnBoard(pos, state.grid)) tiles.push(pos)
    }
  }
  return tiles
}

// Free, safe tiles around `origin` (never water/poison/occupied), row-major.
function freeSafeNeighbours(state, origin, ignoreId = null) {
  const cells = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const pos = { row: origin.row + dr, col: origin.col + dc }
      if ((dr === 0 && dc === 0) || !isOnBoard(pos, state.grid)) continue
      const t = TERRAIN[terrainAt(state, pos)]
      if (t.cost === Infinity || t.grantPoison) continue
      if (state.units.some((u) => u.hp > 0 && u.id !== ignoreId && samePos(u.pos, pos))) continue
      cells.push(pos)
    }
  }
  return cells
}

// Leap landing next to `target` (ignores Zones/paths), closest to the actor.
function pounceLanding(state, actor, target) {
  let best = null
  for (const pos of freeSafeNeighbours(state, target.pos, actor.id)) {
    const dist = chebyshevDist(actor.pos, pos)
    if (!best || dist < best.dist) best = { dist, pos }
  }
  return best ? best.pos : null
}

// Options usable from `pos` with >=1 AP left (mend/shield/hex/summon/slam windup).
function aiSkillOptions(state, enemy, pos, tileScore) {
  const options = []
  const players = livingUnits(state, "player")
  for (const skill of enemySkillsFor(enemy)) {
    if (!skillReady(enemy, skill)) continue
    const kindDef = ENEMY_SKILL_KINDS[skill.kind]
    const base = skillIntentBase(skill)
    if (skill.kind === "mend" || skill.kind === "shield") {
      for (const ally of livingUnits(state, "enemy")) {
        const allyPos = ally.id === enemy.id ? pos : ally.pos
        if (chebyshevDist(pos, allyPos) > kindDef.range) continue
        const hurt = 1 - ally.hp / ally.maxHp
        let score
        if (skill.kind === "mend") {
          const heal = Math.min(skill.amount, ally.maxHp - ally.hp)
          if (heal < 4) continue
          score = AI_ATTACK_BASE + tileScore + 5 * heal + 60 * hurt
        } else {
          if (ally.id === enemy.id || (ally.block || 0) >= skill.amount) continue
          const exposure = aiExposure(state, ally.pos)
          if (!exposure) continue
          score = AI_ATTACK_BASE - 10 + tileScore + 3 * skill.amount + 30 * hurt + (exposure >= 2 ? 10 : 0)
        }
        options.push({ score, intent: { ...base, targetId: ally.id, amount: skill.amount } })
      }
    } else if (skill.kind === "hex") {
      for (const t of players) {
        if (chebyshevDist(pos, t.pos) > kindDef.range) continue
        if (skill.status === "poison" ? (t.poison || 0) >= skill.amount : (t[skill.status] || 0) > 0) continue
        const score = AI_ATTACK_BASE + 35 + tileScore + 0.5 * aiTargetValue(t)
        options.push({ score, intent: { ...base, targetId: t.id, status: skill.status, amount: skill.amount } })
      }
    } else if (skill.kind === "summon") {
      const mine = state.units.filter((u) => u.hp > 0 && u.summonedBy === enemy.id).length
      if (mine >= kindDef.cap || livingUnits(state, "enemy").length >= SUMMON_ENEMY_CAP) continue
      if (!ENEMIES[skill.minion] || !freeSafeNeighbours(state, pos, enemy.id).length) continue
      options.push({ score: AI_ATTACK_BASE + 50 + tileScore, intent: { ...base, minion: skill.minion, minionName: ENEMIES[skill.minion].name } })
    } else if (skill.kind === "slam" && !enemy.windup) {
      let bestCenter = null
      for (const p of players) {
        if (chebyshevDist(pos, p.pos) > kindDef.range) continue
        const hits = players.filter((q) => chebyshevDist(q.pos, p.pos) <= 1).length
        if (!bestCenter || hits > bestCenter.hits) bestCenter = { center: p.pos, hits }
      }
      if (!bestCenter) continue
      const score = AI_ATTACK_BASE + 20 + tileScore + 45 * bestCenter.hits
      options.push({ score, intent: { ...base, phase: "windup", center: bestCenter.center, tiles: slamTiles(state, bestCenter.center), amount: skill.amount } })
    }
  }
  return options
}

// Pounce: a whole-turn leap (2 AP) from where the enemy stands.
function aiPounceOptions(state, enemy) {
  if (enemy.ap < 2 || enemy.root > 0) return []
  const options = []
  for (const skill of enemySkillsFor(enemy)) {
    if (skill.kind !== "pounce" || !skillReady(enemy, skill)) continue
    for (const target of aiTargetsFrom(state, { ...enemy, range: enemy.move + 2 }, enemy.pos)) {
      if (chebyshevDist(enemy.pos, target.pos) < 2) continue
      const land = pounceLanding(state, enemy, target)
      if (!land) continue
      const dmg = aiEstimateHit({ ...enemy, pos: land, attack: enemy.attack + skill.bonus }, target)
      const kill = dmg >= target.hp && !(target.revive > 0)
      const tile = isCautiousEnemy(enemy) ? -6 * aiExposure(state, land) : 0
      const score = AI_ATTACK_BASE + 10 + tile + (kill ? AI_KILL_BONUS : 0) + 3 * dmg + aiTargetValue(target)
      options.push({ score, intent: { ...skillIntentBase(skill), targetId: target.id, land, bonus: skill.bonus } })
    }
  }
  return options
}

function readyEnrage(enemy) {
  return enemySkillsFor(enemy).find(
    (s) => s.kind === "enrage" && skillReady(enemy, s) && enemy.hp < enemy.maxHp * ENEMY_SKILL_KINDS.enrage.threshold,
  )
}

// Free action: +attack, then the enemy still takes its normal turn.
function applyEnrage(state, enemyId, skill) {
  const e = getUnit(state, enemyId)
  let next = startSkillCd(setUnit(state, enemyId, { attack: e.attack + skill.amount }), enemyId, skill)
  next = emit(next, { kind: "power", actorId: enemyId, label: `${skill.name}!` })
  return { ...next, log: [...next.log, `${e.name} flies into a ${skill.name} (+${skill.amount} attack)!`] }
}

// The slam's crush: every living player unit still on the marked tiles.
function applySlamRelease(state, enemyId, intent, skill) {
  const actor = getUnit(state, enemyId)
  let next = startSkillCd(setUnit(state, enemyId, { windup: null, ap: Math.max(0, actor.ap - 1) }), enemyId, skill)
  next = emit(next, { kind: "aoe", actorId: enemyId })
  next = emit(next, { kind: "reaction", unitId: enemyId, label: `${intent.name}!` })
  next = { ...next, log: [...next.log, `${actor.name} brings down ${intent.name}!`] }
  const victims = livingUnits(next, "player").filter((p) => intent.tiles.some((t) => samePos(t, p.pos)))
  if (!victims.length) return { ...next, log: [...next.log, `${intent.name} crushes only empty ground.`] }
  for (const p of victims) {
    const live = getUnit(next, p.id)
    if (!live || live.hp <= 0) continue
    const { next: hit, absorbed, armourUsed, remaining, fell, revived } = applyDamageWithBlock(next, p.id, modifiedAttackAmount(actor, live, intent.amount))
    next = hit
    next = { ...next, log: [...next.log, `${intent.name} crushes ${live.name} for ${remaining}.${describeAbsorb(absorbed, armourUsed)}${fell ? " It falls." : ""}${describeRevive(revived, live.name)}`] }
    next = relicFx.fireOnHit(next, p.id, enemyId, remaining)
    if (next.phase === "won" || next.phase === "lost" || !(getUnit(next, enemyId)?.hp > 0)) break
  }
  return checkTacticsBattleEnd(next)
}

const HEX_WORD = { weak: "Weakened!", vulnerable: "Vulnerable!", poison: "Poisoned!", root: "Rooted!" }

function applyEnemySkill(state, enemyId, intent) {
  let next = state
  if (intent.to) {
    next = moveUnit(next, enemyId, intent.to)
    if (next.phase !== "enemy") return next
  }
  const actor = getUnit(next, enemyId)
  if (!actor || actor.hp <= 0) return next
  const skill = enemySkillsFor(actor).find((s) => s.id === intent.skillId)
  if (!skill) return next
  if (skill.kind === "enrage") return applyEnemyIntent(applyEnrage(next, enemyId, skill), enemyId, intent.then)
  if (skill.kind === "slam" && intent.phase === "release") return applySlamRelease(next, enemyId, intent, skill)
  if (skill.kind === "pounce") {
    const target = getUnit(next, intent.targetId)
    if (!target || target.hp <= 0 || actor.ap < 2) return next
    const facing = cardinalDir(intent.land.col - actor.pos.col, intent.land.row - actor.pos.row)
    next = startSkillCd(setUnit(next, enemyId, { pos: intent.land, facing, ap: 1, attack: actor.attack + skill.bonus }), enemyId, skill)
    next = emit(next, { kind: "power", actorId: enemyId, label: `${skill.name}!` })
    next = { ...next, log: [...next.log, `${actor.name} leaps at ${target.name} - ${skill.name}!`] }
    next = attackUnit(next, enemyId, target.id)
    const after = getUnit(next, enemyId)
    return after ? setUnit(next, enemyId, { attack: after.attack - skill.bonus }) : next
  }
  if (actor.ap < 1) return next
  next = setUnit(next, enemyId, { ap: actor.ap - 1 })
  next = emit(next, { kind: "power", actorId: enemyId, label: `${skill.name}!` })
  if (skill.kind === "slam") {
    // Cooldown starts on the release, not the windup.
    next = setUnit(next, enemyId, { windup: { skillId: skill.id, name: skill.name, amount: intent.amount, center: intent.center, tiles: intent.tiles } })
    return { ...next, log: [...next.log, `${actor.name} winds up ${skill.name} - the marked tiles will be crushed next turn!`] }
  }
  next = startSkillCd(next, enemyId, skill)
  if (skill.kind === "mend") {
    const ally = getUnit(next, intent.targetId)
    if (!ally || ally.hp <= 0) return next
    const hp = Math.min(ally.maxHp, ally.hp + skill.amount)
    next = emit(setUnit(next, ally.id, { hp }), { kind: "heal", actorId: enemyId, targetId: ally.id, amount: hp - ally.hp })
    return { ...next, log: [...next.log, `${actor.name}'s ${skill.name} mends ${ally.name} for ${hp - ally.hp}.`] }
  }
  if (skill.kind === "shield") {
    const ally = getUnit(next, intent.targetId)
    if (!ally || ally.hp <= 0) return next
    next = setUnit(next, ally.id, { block: (ally.block || 0) + skill.amount })
    return { ...next, log: [...next.log, `${actor.name}'s ${skill.name} shields ${ally.name} (+${skill.amount} Block).`] }
  }
  if (skill.kind === "hex") {
    const t = getUnit(next, intent.targetId)
    if (!t || t.hp <= 0) return next
    const patch =
      skill.status === "poison"
        ? { poison: (t.poison || 0) + skill.amount }
        : skill.status === "root"
          ? { root: Math.max(t.root || 0, ROOT_DURATION) }
          : { [skill.status]: Math.max(t[skill.status] || 0, 1) }
    next = emit(setUnit(next, t.id, patch), { kind: "reaction", unitId: t.id, label: HEX_WORD[skill.status] })
    const effect = { poison: `is poisoned (+${skill.amount}).`, root: "is rooted in place!", weak: "is weakened.", vulnerable: "is left vulnerable." }[skill.status]
    return { ...next, log: [...next.log, `${actor.name} casts ${skill.name} on ${t.name}. ${t.name} ${effect}`] }
  }
  if (skill.kind === "summon") {
    const cell = freeSafeNeighbours(next, actor.pos, enemyId)[0]
    if (!cell) return next
    const uid = `${enemyId}-s${next.units.length}`
    const minion = { ...deriveTacticsUnit(skill.minion, "enemy", cell, uid), summonedBy: enemyId, enemySkills: [], ap: 0 }
    next = { ...next, units: [...next.units, { ...minion, baseAttack: minion.attack }] }
    next = emit(next, { kind: "reaction", unitId: uid, label: "Summoned!" })
    return { ...next, log: [...next.log, `${actor.name} calls ${skill.name} - a ${minion.name} answers.`] }
  }
  return next
}

function decideEnemyIntent(state, enemyId) {
  const enemy = getUnit(state, enemyId)
  if (!enemy || enemy.hp <= 0) return { kind: "hold" }

  // Enemy skills: a wound-up slam always lands; Frenzy is free, then act.
  if (enemy.windup) {
    const skill = enemySkillsFor(enemy).find((s) => s.id === enemy.windup.skillId)
    if (skill) return { ...skillIntentBase(skill), phase: "release", center: enemy.windup.center, tiles: enemy.windup.tiles, amount: enemy.windup.amount }
  }
  const enrage = readyEnrage(enemy)
  if (enrage) {
    const then = decideEnemyIntent(applyEnrage(state, enemyId, enrage), enemyId)
    return { ...skillIntentBase(enrage), amount: enrage.amount, then }
  }

  // The final boss's real weightedRandom AoE - see deterministicRoll's
  // own comment for why this reads state.turn instead of Math.random.
  if (enemy.aoeMove && deterministicRoll(state.turn, enemy.id) < enemy.aoeMove.chance) {
    return { kind: "aoe", amount: enemy.aoeMove.amount }
  }

  const players = livingUnits(state, "player")
  if (!players.length) return { kind: "hold" }
  const taunters = livingTaunters(state, "player")
  const focusPool = taunters.length ? taunters : players
  // Who to walk toward when no hit is possible this turn.
  const focus = focusPool.reduce(
    (best, t) => {
      const score = aiTargetValue(t) - 6 * chebyshevDist(enemy.pos, t.pos)
      return score > best.score ? { t, score } : best
    },
    { t: null, score: -Infinity },
  ).t

  let best = { score: -Infinity, intent: { kind: "hold" } }
  for (const pos of [enemy.pos, ...reachableTilesFor(state, enemyId)]) {
    const stay = samePos(pos, enemy.pos)
    const outcome = aiMoveOutcome(state, enemy, pos)
    const tileScore = aiTileScore(state, enemy, pos, outcome)
    if (tileScore === null) continue
    const attacker = { ...enemy, pos }
    // Ranged never walk INTO melee reach to shoot (staying + retreating is handled below).
    const rangedIntoMelee = enemy.range > 1 && !stay && aiAdjacentPlayerMelee(state, pos).length > 0
    if (outcome.apLeft >= 1 && !rangedIntoMelee) {
      for (const target of aiTargetsFrom(state, enemy, pos)) {
        const dmg = aiEstimateHit(attacker, target)
        const kill = dmg >= target.hp && !(target.revive > 0)
        const facing = classifyFacingAttack(attacker, target)
        const score = AI_ATTACK_BASE + tileScore + (kill ? AI_KILL_BONUS : 0) + 3 * dmg + aiTargetValue(target) + AI_FACING_BONUS[facing]
        if (score > best.score) {
          best = { score, intent: stay ? { kind: "attack", targetId: target.id } : { kind: "move-attack", to: pos, targetId: target.id } }
        }
      }
    }
    if (outcome.apLeft >= 1) {
      for (const opt of aiSkillOptions(state, enemy, pos, tileScore)) {
        if (opt.score > best.score) best = { score: opt.score, intent: stay ? opt.intent : { ...opt.intent, to: pos } }
      }
    }
    // Approach option: close the gap to the focus (ranged aim for max range).
    const dist = chebyshevDist(pos, focus.pos)
    const gap = Math.max(0, dist - enemy.range) * 10 + (enemy.range > 1 ? Math.max(0, enemy.range - dist) * 2 : 0)
    const nearest = Math.min(...players.map((p) => chebyshevDist(pos, p.pos)))
    const score = tileScore - gap - nearest * 0.1
    if (score > best.score) best = { score, intent: stay ? { kind: "hold" } : { kind: "move", to: pos } }
  }
  for (const opt of aiPounceOptions(state, enemy)) {
    if (opt.score > best.score) best = opt
  }

  // Ranged enemies stuck next to melee shoot first, then step back if
  // the reaction hits won't cripple them.
  const intent = best.intent
  if (intent.kind === "attack" && enemy.range > 1 && enemy.ap >= 2) {
    const adjacent = aiAdjacentPlayerMelee(state, enemy.pos).filter((u) => !(u.suppressed > 0))
    const reactionDmg = adjacent.reduce((sum, c) => sum + aiEstimateHit(c, enemy), 0)
    if (adjacent.length && reactionDmg * 2 < enemy.hp) return { ...intent, retreat: true }
  }
  return intent
}

function applyEnemyIntent(state, enemyId, intent) {
  if (intent.kind === "attack") {
    const hit = attackUnit(state, enemyId, intent.targetId)
    if (!intent.retreat || hit.phase !== "enemy") return hit
    const to = aiRetreatTile(hit, enemyId)
    return to ? moveUnit(hit, enemyId, to) : hit
  }
  if (intent.kind === "skill") return applyEnemySkill(state, enemyId, intent)
  if (intent.kind === "aoe") return applyEnemyAoe(state, enemyId, intent.amount)
  if (intent.kind === "move") return moveUnit(state, enemyId, intent.to)
  if (intent.kind === "move-attack") {
    const moved = moveUnit(state, enemyId, intent.to)
    return attackUnit(moved, enemyId, intent.targetId)
  }
  return state
}

// The final boss's real AoE (autoBattleEngine.js's own actSide): hits
// every living player unit directly through the SAME modifiedAttackAmount
// + applyDamageWithBlock pipeline a normal attack uses (confirmed by
// reading dealDamage directly - the real game's own aoe intent is just
// {type:"damage", amount} applied once per target in its own targetPool,
// the identical function every other hit already goes through) - so
// Strength/WoundedFury/Weak/Execute/Shatter/Block/Bulwark/Revive ALL
// apply exactly as they would on a single-target attack. The one real
// difference: no attackableTargets/range check at all - it bypasses
// target-picking entirely, the real reason "hide the squad behind one
// tank" stops working here. Targets are snapshotted once before the
// loop (matching applyChargeTick's own established loop shape), and
// checkOnDealDamageTriggers fires per target so the boss's own 60%-phase
// Weak-on-hit trigger correctly applies to every unit it actually
// damages, not just a single chosen one.
function applyEnemyAoe(state, actorId, amount) {
  const actor = getUnit(state, actorId)
  let next = emit({ ...state, log: [...state.log, `${actor.name} unleashes a squad-wide strike!`] }, { kind: "aoe", actorId })
  for (const target of livingUnits(next, "player")) {
    const live = getUnit(next, target.id)
    if (!live || live.hp <= 0) continue
    const { next: hit, absorbed, armourUsed, remaining, fell, revived } = applyDamageWithBlock(next, target.id, modifiedAttackAmount(actor, live, amount))
    next = hit
    const absorbedNote = describeAbsorb(absorbed, armourUsed)
    const fellNote = fell ? " It falls." : ""
    next = { ...next, log: [...next.log, `${actor.name} strikes ${live.name} for ${remaining}.${absorbedNote}${fellNote}${describeRevive(revived, live.name)}`] }
    next = checkOnDealDamageTriggers(next, actorId, target.id, remaining)
    next = relicFx.fireOnHit(next, target.id, actorId, remaining)
    if (!(getUnit(next, actorId)?.hp > 0) || next.phase === "won" || next.phase === "lost") break
  }
  return checkTacticsBattleEnd(next)
}

function decideAndActEnemy(state, enemyId) {
  return applyEnemyIntent(state, enemyId, decideEnemyIntent(state, enemyId))
}

// The player-facing telegraph: what every living enemy currently intends,
// computed by dry-running the exact same decide-then-apply pipeline
// runEnemyTurn uses, on a scratch copy of the state - never the real one.
// Each enemy's decision runs against the OUTCOME of every earlier enemy's
// (also-hypothetical) action, so a later enemy's shown intent already
// accounts for an earlier one's telegraphed kill or repositioning - this
// is what makes the read trustworthy for a 2+-enemy turn, not just the
// first actor. Called fresh every render during the player's phase; never
// persisted, so it can never go stale.
//
// The scratch copy's phase is forced to "enemy" for the run (discarded
// with the rest of scratch when this returns) - moveUnit/attackUnit both
// gate on `state.phase === unit.side`, so a scratch left at "player" would
// silently refuse every hypothetical enemy action, degrading this into
// independent per-enemy reads instead of a real sequential preview.
export function previewEnemyIntents(state) {
  // The AI reads AP/root/slow/Block/HP/skill cooldowns, so the scratch runs
  // the REAL enemy-phase start (ticks, resets, poison) first - exact.
  let scratch = state.phase === "player" ? enemyPhaseStart(state) : { ...state, phase: "enemy" }
  if (scratch.phase !== "enemy") return []
  scratch = applyPoisonTick(scratch)
  const intents = []
  for (const enemy of scratch.units.filter((u) => u.side === "enemy" && u.hp > 0)) {
    if (scratch.phase !== "enemy") break
    // A stunned enemy skips its turn (relicFx.spendStun in runEnemyTurn).
    const stunned = relicFx.spendStun(scratch, enemy.id)
    if (stunned) {
      intents.push({ enemyId: enemy.id, intent: { kind: "stunned" } })
      scratch = stunned
      continue
    }
    const intent = decideEnemyIntent(scratch, enemy.id)
    intents.push({ enemyId: enemy.id, intent })
    scratch = applyEnemyIntent(scratch, enemy.id, intent)
  }
  return intents
}

// The Rot's real DoT mechanic (effects.js's own tickPoison, read
// directly): poison deals damage equal to its current stack count
// DIRECTLY to hp - bypassing Block entirely, never touching it, unlike
// every other damage source in this engine - then decays by exactly 1.
// Only the player side is ever poisoned by this archetype (the real
// game's debuff steps all target "player"); a future archetype that
// poisons enemies would extend this scan, not this one. `!(live.poison >
// 0)` rather than `live.poison <= 0` - many of this file's existing
// synthetic verify states hand-build a unit without a `poison` field at
// all, and `undefined <= 0` is false (NaN comparison), which would have
// silently corrupted hp to NaN below for every pre-Rot check. Only calls
// checkTacticsBattleEnd when a stack actually ticked - not unconditionally
// on every call - since an enemy-less synthetic state (several existing
// verify checks build one to isolate a mechanic from combat entirely)
// would otherwise see "0 living enemies" and falsely resolve as "won"
// even though poison never did anything.
function applyPoisonTick(state) {
  let next = state
  let anyTicked = false
  for (const unit of livingUnits(state, "player")) {
    const live = getUnit(next, unit.id)
    if (!live || live.hp <= 0 || !(live.poison > 0)) continue
    anyTicked = true
    const stacks = live.poison
    const nextHp = Math.max(0, live.hp - stacks)
    const fellNote = nextHp <= 0 ? " It falls." : ""
    next = setUnit(next, unit.id, { hp: nextHp, poison: stacks - 1 })
    next = { ...next, log: [...next.log, `${live.name} takes ${stacks} poison damage.${fellNote}`] }
  }
  return anyTicked ? checkTacticsBattleEnd(next) : next
}

// Thornmaw's real Regen (effects.js's own tickRegen) - Poison's exact
// structural mirror, healing instead of damaging: heals for the CURRENT
// stack, then decays it by 1. Enemy-only (poison above is player-only
// for the identical reason - that's the only side any real content
// currently grants it to). Never calls checkTacticsBattleEnd - regen
// can't kill anyone, so there's nothing it could ever end.
function applyRegenTick(state) {
  let next = state
  for (const unit of livingUnits(state, "enemy")) {
    const live = getUnit(next, unit.id)
    if (!live || live.hp <= 0 || !(live.regen > 0)) continue
    const stacks = live.regen
    const healedHp = Math.min(live.maxHp, live.hp + stacks)
    next = setUnit(next, unit.id, { hp: healedHp, regen: stacks - 1 })
    next = { ...next, log: [...next.log, `${live.name} mends ${healedHp - live.hp} from its own regeneration.`] }
  }
  return next
}

export function runEnemyTurn(state) {
  if (state.phase === "deploy") return state
  // Poison ticks at the TOP of the enemy phase, before anyone acts -
  // matching the real game's own tickPoison timing exactly ("the top of
  // the round, before anyone acts"). This operates on whatever stacks
  // survived untouched through the player's own turn; any FRESH poison
  // an enemy applies during the action loop below won't tick until the
  // NEXT enemy phase, a full cycle later - not immediately in this same
  // call. Also deliberately before the Block reset further down: whatever
  // Block a player unit still carries from earlier this turn is still
  // present at this instant, and poison bypasses it entirely regardless
  // (it deals its damage directly to hp, never reading Block at all).
  let next = applyPoisonTick(state)
  if (next.phase !== "enemy") return next
  for (const enemy of next.units.filter((u) => u.side === "enemy" && u.hp > 0)) {
    if (next.phase !== "enemy") break
    const stunned = relicFx.spendStun(next, enemy.id)
    next = stunned || decideAndActEnemy(next, enemy.id)
  }
  if (next.phase !== "enemy") return next
  // Player AP AND Block reset exactly here - Block granted during a player
  // turn must survive through the FOLLOWING enemy turn (that's when it
  // protects against incoming hits) and only fades once it's the player's
  // turn again. Re-scopes the live game's "resets every round" rule from
  // "every round" to "every time it's this side's turn again." Cooldowns
  // count down at this SAME checkpoint - once per the player's own turn
  // coming back around, so a cooldown of 2 plays out as "usable every
  // other turn" (cast on turn N, still cooling on N+1, ready on N+2).
  // Frost Zone round: player-side `slow` decays at this same
  // checkpoint, mirroring cooldownRemaining's own ordering exactly -
  // see SLOW_DURATION's own comment for why a granted counter of N
  // produces exactly N-1 turns of visible effect under this ordering.
  // The `|| 0` guard is required (not optional) - see resetForEnemyPhase's
  // own comment above for the exact same reasoning. Thorn Zone round:
  // player-side `root` decays alongside it, same mechanism. Retreat
  // Step round: `retreatStepUsed` resets here too.
  const returnedToPlayer = {
    ...next,
    phase: "player",
    turn: next.turn + 1,
    units: next.units.map((u) =>
      u.side === "player"
        ? {
            ...u,
            ap: u.apMax,
            block: 0,
            cooldownRemaining: Math.max(0, u.cooldownRemaining - 1),
            slow: Math.max(0, (u.slow || 0) - 1),
            root: Math.max(0, (u.root || 0) - 1),
            retreatStepUsed: false,
            sidestepUsed: false,
            spiritShiftUsed: false,
            suppressed: Math.max(0, (u.suppressed || 0) - 1),
          }
        : u,
    ),
    log: [...next.log, `Turn ${next.turn + 1}. Your turn.`],
  }
  // Squad Passive round: Tommy's own real turnStart Block trigger fires
  // here, right after Block just reset to 0 above - the same "reset then
  // re-grant" ordering already established for the enemy side (see
  // endPlayerTurn's own comment on this).
  // Objective: Survive completes / reinforcements arrive.
  const objTicked = objectiveNewTurn(returnedToPlayer)
  if (objTicked.phase !== "player") return objTicked
  const relicTicked = relicFx.relicTurnStart(objTicked, "player")
  if (relicTicked.phase !== "player") return relicTicked
  return applyTurnStartTriggers(relicTicked, "player")
}

// A QA-only hook (see HeartwoodTactics.jsx's ?debugLowHp=1) - never a real
// feature, just lets a verification pass or a quick manual check reach a
// win/loss without grinding real attack rounds first.
export function withLowEnemyHp(state) {
  // Tactics-default round: real run fights now carry the auto-battle's
  // own start state (Ward/Revive stacks, difficulty-scaled damage), so
  // the QA hook also strips those one-hit shields - still QA-only.
  // Enemy-abilities sprint: skills (heals/summons) off too - QA-only.
  return { ...state, units: state.units.map((u) => (u.side === "enemy" ? { ...u, hp: 1, maxHp: u.maxHp, ward: 0, revive: 0, enemySkills: [] } : u)) }
}

// Shared with tacticsRelics.js (relic/item hooks during a fight).
export { deriveTacticsUnit, emit, getUnit, setUnit, livingUnits, applyDamageWithBlock, applyPortableEffect, checkTacticsBattleEnd, checkEnemyPhase, trySpawnBrood }
