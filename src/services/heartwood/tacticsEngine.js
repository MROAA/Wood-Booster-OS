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
import { isOnBoard, samePos, kingAdjacent, reachableTiles as reachableTilesRaw } from "./targeting"

// Marc: "taistelukenttä saa olla isompi" - the battlefield can be bigger.
// Doubled the tile count (35 -> 70) for real maneuvering room; every
// formation's row spread below is re-centered on the taller grid.
export const GRID = { rows: 7, cols: 10 }

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
// always starts at the right edge, rows 2/3/4, col GRID.cols-1 - unaffected
// by which enemy formation is chosen below.
const PLAYER_DEF_IDS = ["bulwark-of-ages", "the-fool", "hexbreaker"]
// The full 6-unit pool the sidebar squad picker offers. PLAYER_DEF_IDS (the
// default starting 3) is unchanged - only the picker's option list grows.
export const PLAYER_ROSTER_IDS = [...PLAYER_DEF_IDS, "oathshield", "willowmend", "bramble-sweep"]
const START_ROWS = [2, 3, 4]

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
    rows: [2, 3, 4],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  swarm: {
    id: "swarm",
    name: "The Brood",
    description: "Not one thing to fight. A dozen small ones, and every one of them is still a mouth.",
    enemyDefIds: ["sporelet", "mire-gnat", "sporelet", "mire-gnat"],
    rows: [1, 2, 3, 4],
    battleStartBonus: 1,
    fortressBlock: 0,
    selfMend: 0,
  },
  fortress: {
    id: "fortress",
    name: "The Bulwark",
    description: "Two wardens shoulder to shoulder, and a mender behind them stitching every crack shut before you can widen it.",
    enemyDefIds: ["oakshell-warden", "oakshell-warden", "mossmender"],
    rows: [2, 3, 4],
    battleStartBonus: 0,
    fortressBlock: 3,
    selfMend: 0,
  },
  hunters: {
    id: "hunters",
    name: "The Pack",
    description: "Three of them, low and fast, already circling the one of you that looks tired.",
    enemyDefIds: ["fen-stalker", "pack-runner", "fen-stalker"],
    rows: [2, 3, 4],
    battleStartBonus: 2,
    fortressBlock: 0,
    selfMend: 0,
  },
  ancients: {
    id: "ancients",
    name: "The Ancient Grove",
    description: "Two small things moving fast, and behind them one that has not moved yet, and is about to.",
    enemyDefIds: ["sapling-attendant", "ancient-oak", "sapling-attendant"],
    rows: [2, 3, 4],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  coven: {
    id: "coven",
    name: "The Conclave",
    description: "Two of them stand ready, and behind them a third that only ever moves its lips.",
    enemyDefIds: ["bog-devotee", "hex-acolyte", "coven-matron"],
    rows: [2, 3, 4],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  cult: {
    id: "cult",
    name: "The Communion",
    description: "Two kneeling, one counting. In two breaths there will be one kneeling, and the other two will be worse.",
    enemyDefIds: ["sworn-cultist", "sworn-cultist", "ritual-warden"],
    rows: [2, 3, 4],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  brood: {
    id: "brood",
    name: "The Clutch",
    description: "Three of them, swollen and still. Break one open and see what spills out.",
    enemyDefIds: ["brood-mother", "brood-mother", "brood-mother"],
    rows: [2, 3, 4],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  rot: {
    id: "rot",
    name: "The Blight",
    description: "Three of them, low to the ground, and the ground going soft and black behind them.",
    enemyDefIds: ["rotgut-crawler", "spore-lurcher", "rotgut-crawler"],
    rows: [2, 3, 4],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 1,
  },
  collectors: {
    id: "collectors",
    name: "The Tithe",
    description: "Two quick hands and one patient one. They will leave with more than they came with.",
    enemyDefIds: ["hoardling", "tithe-warden", "hoardling"],
    rows: [2, 3, 4],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
  },
  // The first SOLO formation - one body, not a 2-4-piece pack. Deepwarden's
  // real identity (a passive Strength buff + an HP-gated phase that adds a
  // repeating turnStart Block trigger) is exactly what this round's new
  // passive/phases/trigger reading in deriveTacticsUnit/checkEnemyPhase/
  // applyEnemyTurnStartTriggers exists to demonstrate - description is the
  // real enemies.js introLine, reused verbatim.
  deepwarden: {
    id: "deepwarden",
    name: "Deepwarden",
    description: "It has been standing here since before you knew the Hearthwood existed. It isn't moving.",
    enemyDefIds: ["deepwarden"],
    rows: [3],
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
    rows: [3],
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
    rows: [3],
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
    rows: [3],
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
    rows: [3],
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
    rows: [3],
    battleStartBonus: 0,
    fortressBlock: 0,
    selfMend: 0,
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
// applyEnemyTurnStartTriggers below) - only `turnStart` is ever fired
// this round; `onDealDamage`/`onHit` triggers are registered but inert,
// since no currently-ported content needs them yet.
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
function deterministicRoll(turn, seedText) {
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
  if (effect.type === "applyBuff" && ["execute", "shatter", "woundedFury", "weak", "bulwark", "regen", "taunt"].includes(effect.id)) {
    return setUnit(state, unitId, { [effect.id]: (unit[effect.id] || 0) + (effect.amount || 0) })
  }
  if (effect.type === "block") {
    return setUnit(state, unitId, { block: unit.block + (effect.amount || 0) })
  }
  if (effect.type === "heal") {
    return setUnit(state, unitId, { hp: Math.min(unit.maxHp, unit.hp + (effect.amount || 0)) })
  }
  return state
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
function deriveTacticsUnit(defId, side, pos, uid) {
  const def = side === "enemy" ? ENEMIES[defId] : UNITS[defId]
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
    ability: side === "player" ? ABILITIES[defId] || null : null,
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

// `squadDefIds` is a new optional 2nd param (defaults to PLAYER_DEF_IDS,
// today's exact starting 3) - every existing single-arg call site behaves
// byte-identically; only a caller that passes a real squad array (the
// sidebar picker) gets a different lineup.
export function createTacticsBattle(formationId = "default", squadDefIds = PLAYER_DEF_IDS) {
  const formation = ENEMY_FORMATIONS[formationId] || ENEMY_FORMATIONS.default
  const units = [
    ...squadDefIds.map((defId, i) =>
      deriveTacticsUnit(defId, "player", { row: START_ROWS[i], col: GRID.cols - 1 }, `player-${defId}-${i}`),
    ),
    ...formation.enemyDefIds.map((defId, i) =>
      deriveTacticsUnit(defId, "enemy", { row: formation.rows[i], col: 0 }, `enemy-${defId}-${i}`),
    ),
  ]
  // A formation's real synergy bonus: a FLAT, one-time Strength grant to
  // every enemy piece at battle start - not multiplied by headcount,
  // matching each shipped mechanic precisely (the aggregate effect scales
  // with body count, the per-unit grant does not). Swarm's is +1, Hunters'
  // is +2 (same shape, a bigger number since the pack hits harder).
  const bonus = formation.battleStartBonus || 0
  const withBonus = bonus
    ? units.map((u) => (u.side === "enemy" ? { ...u, attack: u.attack + bonus } : u))
    : units
  // A one-time snapshot of each unit's attack once battle-start bonuses
  // are applied - the reference point the UI's coven-buff badge compares
  // against (attack > baseAttack), so only a PER-ROUND buff like the
  // Coven's ever shows as growing, not a formation's one-time grant.
  const withBaseline = withBonus.map((u) => ({ ...u, baseAttack: u.attack }))
  return {
    grid: GRID,
    units: withBaseline,
    phase: "player",
    turn: 1,
    log: [`${formation.name}. The Frontier opens. Your turn.`],
    formationId: formation.id,
  }
}

// Centers `count` consecutive rows in the grid - the same "one row per
// piece" idea every ENEMY_FORMATIONS entry's hand-picked `rows` array
// already encodes (START_ROWS is just this same math for count:3),
// generalized to any count for the real-matchup bridge below, where the
// real squad/enemy side can be 1-4 pieces instead of a curated formation's
// fixed spread.
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
// difficulty scaling, relics, items, or the Commander (no UNITS entry,
// not modeled here at all), and formationId is null so a curated
// formation's PACK-LEVEL synergy bonus (Swarm/Hunters' flat Strength,
// Fortress's per-round Block, Rot's self-mend) never applies to an
// arbitrary real matchup - the same "reuse real data, not the live
// scaling" discipline every archetype round's curated formations already
// follow, just without a formation-level bonus to translate.
export function createRealMatchupBattle(squadDefIds, enemyDefIds) {
  const playerRows = spreadRows(squadDefIds.length, GRID.rows)
  const enemyRows = spreadRows(enemyDefIds.length, GRID.rows)
  const units = [
    ...squadDefIds.map((defId, i) =>
      deriveTacticsUnit(defId, "player", { row: playerRows[i], col: GRID.cols - 1 }, `player-${defId}-${i}`),
    ),
    ...enemyDefIds.map((defId, i) =>
      deriveTacticsUnit(defId, "enemy", { row: enemyRows[i], col: 0 }, `enemy-${defId}-${i}`),
    ),
  ]
  const withBaseline = units.map((u) => ({ ...u, baseAttack: u.attack }))
  return {
    grid: GRID,
    units: withBaseline,
    phase: "player",
    turn: 1,
    log: ["A real matchup from your run. The Frontier opens. Your turn."],
    formationId: null,
  }
}

// A static stat preview of the whole 6-unit roster, for the squad picker's
// per-slot stat line - zero new derivation logic, reuses deriveTacticsUnit
// directly (the exact same function a real squad unit goes through), just
// with a throwaway pos/id since these are never placed on a real board.
export function previewPlayerRoster() {
  return PLAYER_ROSTER_IDS.map((defId, i) => deriveTacticsUnit(defId, "player", { row: 0, col: 0 }, `preview-${defId}-${i}`))
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

// Reachable tiles for a unit right now: the grid's own BFS, blocked by
// every OTHER living piece on the board (either side - you can't walk
// through anyone).
export function reachableTilesFor(state, unitId) {
  const unit = getUnit(state, unitId)
  if (!unit || unit.hp <= 0) return []
  const occupied = state.units.filter((u) => u.id !== unitId && u.hp > 0).map((u) => u.pos)
  return reachableTilesRaw(occupied, unit.pos, unit.move, state.grid)
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
function livingTaunters(state, side) {
  return livingUnits(state, side).filter((u) => u.taunt > 0)
}

export function attackableTargets(state, unitId) {
  const unit = getUnit(state, unitId)
  if (!unit || unit.hp <= 0) return []
  const inRange = state.units.filter(
    (u) => u.side !== unit.side && u.hp > 0 && chebyshevDist(unit.pos, u.pos) <= unit.range,
  )
  const taunters = livingTaunters(state, unit.side === "player" ? "enemy" : "player")
  return taunters.length ? inRange.filter((u) => u.taunt > 0) : inRange
}

function checkTacticsBattleEnd(state) {
  if (state.phase === "won" || state.phase === "lost") return state
  if (livingUnits(state, "enemy").length === 0) return { ...state, phase: "won", log: [...state.log, "Every enemy has fallen. Victory."] }
  if (livingUnits(state, "player").length === 0) return { ...state, phase: "lost", log: [...state.log, "The squad has fallen."] }
  return state
}

export function moveUnit(state, unitId, targetPos) {
  const unit = getUnit(state, unitId)
  if (!unit || unit.hp <= 0 || unit.ap < 1) return state
  if (state.phase !== unit.side) return state
  if (!isOnBoard(targetPos, state.grid)) return state
  const legal = reachableTilesFor(state, unitId)
  if (!legal.some((p) => samePos(p, targetPos))) return state
  return setUnit(state, unitId, { pos: targetPos, ap: unit.ap - 1 })
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
function modifiedAttackAmount(attacker, defender, baseAmount) {
  let amount = baseAmount
  if (attacker.woundedFury > 0 && attacker.hp < attacker.maxHp * 0.5) amount += 3
  if (attacker.weak > 0) amount = Math.floor(amount * 0.75)
  if (attacker.execute > 0 && defender.hp <= defender.maxHp * 0.3) amount += attacker.execute
  if (attacker.shatter > 0 && defender.block > 0) amount += attacker.shatter
  return amount
}

// Reuses the live game's own Block model (effects.js's dealDamage: absorb
// then deplete) rather than inventing a new mitigation shape.
// Iron Sentinel's real Bulwark (effects.js's own dealDamage): real Block
// is spent FIRST, then Bulwark absorbs whatever's left - but Bulwark is
// never decremented, so it keeps soaking the same amount off every hit,
// all battle (the exact real order, not assumed - Block's own "spent
// and reset every round" behavior never applies to it).
function applyDamageWithBlock(state, targetId, amount) {
  const target = getUnit(state, targetId)
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
  const next = setUnit(state, targetId, { block: target.block - blockSpent, hp: nextHp, revive: revived ? revives - 1 : target.revive })
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
  if (!actor || actor.side !== "enemy" || remaining <= 0) return state
  let next = state
  for (const t of actor.triggers || []) {
    if (t.trigger !== "onDealDamage") continue
    const recipientId = t.effect.target === "target" ? targetId : actorId
    const recipient = getUnit(next, recipientId)
    if (!recipient || recipient.hp <= 0) continue
    next = applyPortableEffect(next, recipientId, t.effect)
    const onTargetNote = recipientId === targetId ? ` on ${recipient.name}` : ""
    next = { ...next, log: [...next.log, `${actor.name} ${describePortableEffect(t.effect)}${onTargetNote}.`] }
  }
  return next
}

export function attackUnit(state, actorId, targetId) {
  const actor = getUnit(state, actorId)
  const target = getUnit(state, targetId)
  if (!actor || !target || actor.hp <= 0 || target.hp <= 0 || actor.ap < 1) return state
  if (state.phase !== actor.side || actor.side === target.side) return state
  if (chebyshevDist(actor.pos, target.pos) > actor.range) return state
  let next = setUnit(state, actorId, { ap: actor.ap - 1 })
  const { next: hit, absorbed, armourUsed, remaining, fell, revived } = applyDamageWithBlock(next, targetId, modifiedAttackAmount(actor, target, actor.attack))
  next = hit
  const absorbedNote = describeAbsorb(absorbed, armourUsed)
  const fellNote = fell ? " It falls." : ""
  next = { ...next, log: [...next.log, `${actor.name} strikes ${target.name} for ${remaining}.${absorbedNote}${fellNote}${describeRevive(revived, target.name)}`] }
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
  return checkTacticsBattleEnd(next)
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
    return { ...next, log: [...next.log, `${actor.name} raises ${ability.name}.`] }
  }

  if (ability.kind === "heal") {
    const target = getUnit(state, targetId)
    if (!target || target.hp <= 0 || target.side !== actor.side) return state
    if (target.id !== actorId && !kingAdjacent(target.pos, actor.pos)) return state
    let next = setUnit(state, actorId, { ap: actor.ap - ability.cost, cooldownRemaining: ability.cooldown })
    const live = getUnit(next, target.id)
    const healedHp = Math.min(live.maxHp, live.hp + ability.amount)
    next = setUnit(next, target.id, { hp: healedHp })
    return { ...next, log: [...next.log, `${actor.name} mends ${target.name} for ${healedHp - live.hp}.`] }
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

  return state
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
  if (effect.type === "block") return "braces for the next blow"
  if (effect.type === "heal") return "steadies itself"
  return "stirs"
}

function applyEnemyTurnStartTriggers(state) {
  let next = state
  for (const enemy of livingUnits(state, "enemy")) {
    for (const t of enemy.triggers || []) {
      if (t.trigger !== "turnStart") continue
      const live = getUnit(next, enemy.id)
      if (!live || live.hp <= 0) continue
      next = applyPortableEffect(next, enemy.id, t.effect)
      next = { ...next, log: [...next.log, `${live.name} ${describePortableEffect(t.effect)}.`] }
    }
  }
  return next
}

export function endPlayerTurn(state) {
  if (state.phase !== "player") return state
  // applyCovenTick and applyRotMendTick never touch hp downward, so
  // neither can end the battle - no phase guard needed for either,
  // unlike the two ticks below.
  const covened = applyCovenTick(state)
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
  const resetForEnemyPhase = {
    ...ticked,
    phase: "enemy",
    units: ticked.units.map((u) => (u.side === "enemy" ? { ...u, ap: u.apMax, block: fortressBlock } : u)),
    log: [...ticked.log, "Enemy turn."],
  }
  // Regen ticks (heals whatever stack SURVIVED the player's turn, then
  // decays it) BEFORE applyEnemyTurnStartTriggers grants this round's
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
  const next = applyEnemyTurnStartTriggers(regenTicked)
  return runEnemyTurn(next)
}

// A deliberately simple scripted AI (Phase 1's job is proving the PLAYER's
// turn feels good, not shipping a clever opponent): if a living player unit
// is already in range, attack the weakest one in range; otherwise step
// toward the nearest living player unit and re-check range from the new
// tile. One decision per enemy, in roster order.
//
// Split into a pure decision (decideEnemyIntent) and a mutation that acts
// on that decision (applyEnemyIntent) so BOTH the real enemy turn AND the
// player-facing intent telegraph (previewEnemyIntents, below) run through
// the exact same logic - there is no second "what will the enemy do" model
// that could drift out of sync with what actually happens.
function decideEnemyIntent(state, enemyId) {
  const enemy = getUnit(state, enemyId)
  if (!enemy || enemy.hp <= 0) return { kind: "hold" }

  // The final boss's real weightedRandom AoE - see deterministicRoll's
  // own comment for why this reads state.turn instead of Math.random.
  // Checked before the normal attack branch below, exactly like the
  // real moveSelect:"weightedRandom" picks freely among ALL of an
  // enemy's moves each turn, not only when nothing else is available.
  if (enemy.aoeMove && deterministicRoll(state.turn, enemy.id) < enemy.aoeMove.chance) {
    return { kind: "aoe", amount: enemy.aoeMove.amount }
  }

  const inRange = attackableTargets(state, enemyId)
  if (inRange.length) {
    const weakest = inRange.reduce((w, u) => (u.hp < w.hp ? u : w), inRange[0])
    return { kind: "attack", targetId: weakest.id }
  }

  const targets = livingUnits(state, "player")
  if (!targets.length) return { kind: "hold" }
  const options = [enemy.pos, ...reachableTilesFor(state, enemyId)]
  const nearestDistFrom = (pos) => Math.min(...targets.map((t) => chebyshevDist(pos, t.pos)))
  const best = options.reduce((w, pos) => (nearestDistFrom(pos) < nearestDistFrom(w) ? pos : w), options[0])
  if (samePos(best, enemy.pos)) return { kind: "hold" }

  // What WOULD be in range from `best`, without actually moving there -
  // a hypothetical read, same Chebyshev check attackableTargets uses.
  const afterMove = state.units.filter(
    (u) => u.side !== enemy.side && u.hp > 0 && chebyshevDist(best, u.pos) <= enemy.range,
  )
  if (afterMove.length) {
    const weakest = afterMove.reduce((w, u) => (u.hp < w.hp ? u : w), afterMove[0])
    return { kind: "move-attack", to: best, targetId: weakest.id }
  }
  return { kind: "move", to: best }
}

function applyEnemyIntent(state, enemyId, intent) {
  if (intent.kind === "attack") return attackUnit(state, enemyId, intent.targetId)
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
  let next = { ...state, log: [...state.log, `${actor.name} unleashes a squad-wide strike!`] }
  for (const target of livingUnits(next, "player")) {
    const live = getUnit(next, target.id)
    if (!live || live.hp <= 0) continue
    const { next: hit, absorbed, armourUsed, remaining, fell, revived } = applyDamageWithBlock(next, target.id, modifiedAttackAmount(actor, live, amount))
    next = hit
    const absorbedNote = describeAbsorb(absorbed, armourUsed)
    const fellNote = fell ? " It falls." : ""
    next = { ...next, log: [...next.log, `${actor.name} strikes ${live.name} for ${remaining}.${absorbedNote}${fellNote}${describeRevive(revived, live.name)}`] }
    next = checkOnDealDamageTriggers(next, actorId, target.id, remaining)
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
  let scratch = { ...state, phase: "enemy" }
  const intents = []
  for (const enemy of state.units.filter((u) => u.side === "enemy" && u.hp > 0)) {
    if (scratch.phase !== "enemy") break
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
    next = decideAndActEnemy(next, enemy.id)
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
  return {
    ...next,
    phase: "player",
    turn: next.turn + 1,
    units: next.units.map((u) =>
      u.side === "player" ? { ...u, ap: u.apMax, block: 0, cooldownRemaining: Math.max(0, u.cooldownRemaining - 1) } : u,
    ),
    log: [...next.log, `Turn ${next.turn + 1}. Your turn.`],
  }
}

// A QA-only hook (see HeartwoodTactics.jsx's ?debugLowHp=1) - never a real
// feature, just lets a verification pass or a quick manual check reach a
// win/loss without grinding real attack rounds first.
export function withLowEnemyHp(state) {
  return { ...state, units: state.units.map((u) => (u.side === "enemy" ? { ...u, hp: 1, maxHp: u.maxHp } : u)) }
}
