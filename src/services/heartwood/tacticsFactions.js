// Hearthwood Frontier - enemy factions (sprint 3, Enemy Ecosystem PRD
// 14/15/17). Three factions, each with its own board identity:
//   Wanderers - skirmishers: +1 move, hunt the backline, strike then Fade
//               up to 2 tiles away (the engine's applyEnemyIntent hook).
//   Mirror    - "Echo of X": a clone of the player's deployed squad, its
//               abilities turned into enemy skills, slightly weakened.
//   Corrupted - spread Blight tiles each enemy turn (toward your squad);
//               your units on Blight get Poisoned, corrupted units on
//               Blight hit harder and mend.
// Pure functions; the engine calls a few small hooks. Like
// tacticsObjectives.js this imports engine helpers (used only inside
// functions, so the circular import is safe).
import { ENEMIES } from "../../data/heartwood/enemies"
import { UNITS } from "../../data/heartwood/units"
import { FORMATIONS } from "../../data/heartwood/formations"
import { TERRAIN, terrainAt } from "./tacticsTerrain"
import { ENEMY_SKILL_KINDS } from "./tacticsEnemyAbilities"
import { emit, setUnit, livingUnits, deriveTacticsUnit } from "./tacticsEngine"

export const FACTIONS = {
  wanderers: {
    id: "wanderers",
    name: "Wanderers",
    icon: "➶",
    tag: "Wanderers - they strike and vanish",
    hint: "Fast skirmishers. Each one strikes, then fades up to 2 tiles back - and they go for your archers and healers first. Root or Slow them to stop the fade, guard your backline, and corner them against the board's edge.",
  },
  mirror: {
    id: "mirror",
    name: "The Mirror",
    icon: "☽",
    tag: "The Mirror - it fights as you do",
    hint: "Ghostly echoes of your own deployed squad, with your own heroes' tricks - a little thinner than the real thing. Whatever your build is good at, expect it back. Kill the echo of your strongest hero first.",
  },
  corrupted: {
    id: "corrupted",
    name: "The Corrupted",
    icon: "☣",
    tag: "The Corrupted - the ground itself turns on you",
    hint: "Blight spreads across the board every enemy turn, creeping toward your squad. Standing on Blight at the end of your turn Poisons you; corrupted beasts on Blight hit +2 harder and mend 2. Keep moving, fight them off the black ground, and kill the Tainted Sapling to slow the spread.",
  },
}

export function factionInfo(id) {
  return FACTIONS[id] || null
}

// A run encounter id (formation or solo enemy) -> faction id | null.
export function factionForEncounter(encounterId) {
  return FORMATIONS[encounterId]?.faction || ENEMIES[encounterId]?.faction || null
}

// ===== Wanderers =============================================================
export const FADE_RANGE = 2

// Extra target value for a skirmisher: backline first (ranged, healers,
// the Commander), the bodies least able to chase it down.
export function factionTargetBonus(enemy, target) {
  if (!enemy.skirmisher) return 0
  let bonus = 0
  if (target.range > 1) bonus += 20
  if (target.ability?.kind === "heal") bonus += 20
  if (target.id === "player-commander") bonus += 8
  return bonus
}

// ===== Mirror ================================================================
export const ECHO_HP_SCALE = 0.75
export const ECHO_ATTACK_SCALE = 0.8

// The player ability of `defId` (derived exactly as a player unit gets
// it) turned into an enemy skill the AI already knows how to use.
export function echoSkillsFor(defId) {
  if (!UNITS[defId]) return []
  const ability = deriveTacticsUnit(defId, "player", { row: 0, col: 0 }, "echo-probe").ability
  if (!ability) return []
  const name = `Echoed ${ability.name}`
  const mk = (kind, props) => ({ id: "echo", kind, cooldown: ENEMY_SKILL_KINDS[kind].cooldown, name, ...props })
  switch (ability.kind) {
    case "heal": return [mk("mend", { amount: (ability.amount || 4) + 2 })]
    case "aura-block":
    case "shield-ally":
    case "taunt-shout": return [mk("shield", { amount: Math.max(4, 2 * (ability.amount || 2)) })]
    case "poison-strike": return [mk("hex", { status: "poison", amount: ability.amount || 2 })]
    case "root-shot": return [mk("hex", { status: "root", amount: 1 })]
    case "rally": return [mk("enrage", { amount: 2 })]
    default: return [mk("pounce", { bonus: ability.bonus || 2 })]
  }
}

// Turns an enemy-side unit built from a UNITS def into its echo.
// `weaken` (prototype only - a real run weakens via the difficulty factor).
export function echoUnit(unit, { weaken = false } = {}) {
  const base = UNITS[unit.defId]
  const maxHp = weaken ? Math.max(1, Math.round(unit.maxHp * ECHO_HP_SCALE)) : unit.maxHp
  const attack = weaken ? Math.max(1, Math.round(unit.attack * ECHO_ATTACK_SCALE)) : unit.attack
  const name = unit.name.startsWith("Echo of ") ? unit.name : `Echo of ${unit.name}`
  return {
    ...unit,
    name,
    echo: true,
    faction: "mirror",
    art: unit.art || base?.art,
    image: unit.image || base?.image || null,
    maxHp,
    hp: weaken ? maxHp : unit.hp,
    attack,
    baseAttack: attack,
    enemySkills: echoSkillsFor(unit.defId),
  }
}

// ===== Corrupted =============================================================
export const BLIGHT_MAX = 30
export const BLIGHT_ATTACK_BONUS = 2
export const BLIGHT_MEND = 2
export const BLIGHT_POISON = 1

const key = (p) => `${p.row}-${p.col}`

export function isBlighted(state, pos) {
  return !!state.blight?.[key(pos)]
}

function blightable(state, pos) {
  if (pos.row < 0 || pos.col < 0 || pos.row >= state.grid.rows || pos.col >= state.grid.cols) return false
  return TERRAIN[terrainAt(state, pos)].cost !== Infinity
}

function isCorrupted(unit) {
  return unit.faction === "corrupted"
}

// Attack bonus for a corrupted attacker standing on Blight.
export function blightAttackBonus(state, unit) {
  return state && isCorrupted(unit) && isBlighted(state, unit.pos) ? BLIGHT_ATTACK_BONUS : 0
}

// The tiles the corruption will add at the next enemy phase (pure): every
// living corrupted unit taints its own tile, then the frontier grows
// `blightSpread` (default 1) tiles per corrupted unit, each time onto the
// free edge tile closest to the squad.
export function nextBlightSpread(state) {
  const spreaders = livingUnits(state, "enemy").filter(isCorrupted)
  if (!spreaders.length) return []
  const blight = { ...(state.blight || {}) }
  let count = Object.keys(blight).length
  const added = []
  const add = (pos) => {
    if (count >= BLIGHT_MAX || blight[key(pos)] || !blightable(state, pos)) return
    blight[key(pos)] = true
    added.push(key(pos))
    count++
  }
  for (const s of spreaders) add(s.pos)
  const players = livingUnits(state, "player")
  const distToSquad = (pos) => (players.length ? Math.min(...players.map((p) => Math.max(Math.abs(p.pos.row - pos.row), Math.abs(p.pos.col - pos.col)))) : 0)
  // Each spreader grows the edge of the Blight around ITSELF (within 2
  // tiles), leaning toward the squad - so the stain follows the beasts
  // and pools where the fight is, instead of racing across the board.
  for (const s of spreaders) {
    const steps = ENEMIES[s.defId]?.blightSpread || 1
    for (let i = 0; i < steps && count < BLIGHT_MAX; i++) {
      let best = null
      for (const k of Object.keys(blight)) {
        const [r, c] = k.split("-").map(Number)
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const pos = { row: r + dr, col: c + dc }
          if (blight[key(pos)] || !blightable(state, pos)) continue
          const near = Math.max(Math.abs(pos.row - s.pos.row), Math.abs(pos.col - s.pos.col))
          const score = (near > 2 ? 100 + near : 0) + distToSquad(pos)
          if (!best || score < best.score || (score === best.score && (pos.row < best.pos.row || (pos.row === best.pos.row && pos.col < best.pos.col)))) best = { score, pos }
        }
      }
      if (!best) break
      add(best.pos)
    }
  }
  return added
}

// Battle start: a corrupted fight opens with Blight under each corrupted unit.
function seedBlight(state) {
  const blight = {}
  for (const u of livingUnits(state, "enemy").filter(isCorrupted)) if (blightable(state, u.pos)) blight[key(u.pos)] = true
  return { ...state, blight, blightFresh: Object.keys(blight) }
}

// Enemy-phase start hook (inside enemyPhaseStart, so the intent preview
// sees it too): spread, then Poison the squad on Blight, then feed the
// corrupted standing on it.
export function factionEnemyPhaseStart(state) {
  if (state.faction !== "corrupted" && !state.blight) return state
  const added = nextBlightSpread(state)
  let next = { ...state, blight: { ...(state.blight || {}) }, blightFresh: added }
  for (const k of added) next.blight[k] = true
  if (added.length) {
    const spreader = livingUnits(next, "enemy").find(isCorrupted)
    next = { ...next, log: [...next.log, `The corruption spreads (${added.length} tile${added.length > 1 ? "s" : ""} of Blight).`] }
    if (spreader) next = emit(next, { kind: "reaction", unitId: spreader.id, label: "Blight spreads!" })
  }
  for (const p of livingUnits(next, "player")) {
    if (!isBlighted(next, p.pos)) continue
    next = setUnit(next, p.id, { poison: (p.poison || 0) + BLIGHT_POISON })
    next = emit(next, { kind: "reaction", unitId: p.id, label: "Blighted!" })
    next = { ...next, log: [...next.log, `${p.name} stands in the Blight and is Poisoned (+${BLIGHT_POISON}).`] }
  }
  for (const e of livingUnits(next, "enemy").filter(isCorrupted)) {
    if (!isBlighted(next, e.pos) || e.hp >= e.maxHp) continue
    const hp = Math.min(e.maxHp, e.hp + BLIGHT_MEND)
    next = emit(setUnit(next, e.id, { hp }), { kind: "heal", actorId: e.id, targetId: e.id, amount: hp - e.hp })
    next = { ...next, log: [...next.log, `${e.name} drinks from the Blight (+${hp - e.hp} HP).`] }
  }
  return next
}

// ===== Setup =================================================================
// Tags a freshly built battle with its faction: `state.faction`, per-unit
// `faction`, echoes for the Mirror, starting Blight for the Corrupted.
export function applyFaction(state, factionId, { weakenEchoes = false } = {}) {
  if (!state || !FACTIONS[factionId]) return state
  let next = {
    ...state,
    faction: factionId,
    units: state.units.map((u) => {
      if (u.side !== "enemy") return u
      if (factionId === "mirror" && !ENEMIES[u.defId] && UNITS[u.defId]) return echoUnit(u, { weaken: weakenEchoes })
      return { ...u, faction: u.faction || factionId }
    }),
    log: [...(state.log || []), `${FACTIONS[factionId].icon} ${FACTIONS[factionId].tag}.`],
  }
  if (factionId === "corrupted") next = seedBlight(next)
  return next
}

// Panel/banner text for the board.
export function describeFaction(state) {
  const f = FACTIONS[state?.faction]
  if (!f) return null
  const blightCount = Object.keys(state.blight || {}).length
  return { ...f, blightCount }
}

// Convenience for UI: the Blight tiles that will be added next enemy phase.
export function blightPreviewKeys(state) {
  if (!state || state.phase !== "player" || (state.faction !== "corrupted" && !state.blight)) return []
  return nextBlightSpread(state)
}
