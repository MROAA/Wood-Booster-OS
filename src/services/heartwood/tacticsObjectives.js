// Hearthwood Frontier - battle objectives (sprint 2). Not every fight is
// "defeat all enemies": Survive N turns, Protect an allied NPC, Destroy
// the Totem, plus a Reinforcements modifier. Pure functions; the engine
// calls 3 small hooks (battle end, enemy-phase start, new player turn).
//
// Spec (pure data, from the seed - also shown on the formation screen):
//   { type: "kill"|"survive"|"protect"|"totem", act, turns?, pulseEvery?,
//     pulseKind?, pulseAmount?, totemHp?, npcHp?, reinforce?: { turn, count } }
// Battle state gets `objective` (see applyObjective) - absent = kill-all.
import { streamRng } from "../../data/heartwood/seed"
import { emit, getUnit, setUnit, livingUnits, applyDamageWithBlock, checkTacticsBattleEnd, deriveTacticsUnit } from "./tacticsEngine"

export const OBJECTIVE_TYPES = ["kill", "survive", "protect", "totem"]
export const OBJECTIVE_NAMES = {
  kill: "Defeat all enemies",
  survive: "Survive",
  protect: "Protect the Wandering Seer",
  totem: "Destroy the Totem",
}
export const NPC_ID = "player-npc-seer"
export const TOTEM_ID = "enemy-objective-totem"

// Chance a regular battle gets a non-default objective: 38% in Act I,
// +3pp per Act (Act VII = 56%).
export function specialObjectiveChance(act) {
  return 0.38 + 0.03 * (act - 1)
}

// Builds the params for one objective type at a given Act.
export function buildObjectiveSpec(type, act = 1, { pulseKind = "mend", reinforce = null } = {}) {
  const spec = { type, act, reinforce }
  if (type === "survive") {
    spec.turns = act >= 4 ? 5 : 4
    spec.reinforce = reinforce || { turn: 3, count: act >= 5 ? 2 : 1 }
  } else if (type === "protect") {
    spec.npcHp = 14 + 2 * act
  } else if (type === "totem") {
    spec.pulseEvery = act >= 5 ? 2 : 3
    spec.pulseKind = pulseKind
    spec.pulseAmount = pulseKind === "blast" ? 2 + Math.ceil(act / 2) : 5 + act
    spec.totemHp = 16 + 4 * act
  }
  return spec
}

// Deterministic per (seed, nodeIndex). Elites/minibosses/bosses and the
// run's very first fight stay kill-all.
export function objectiveForNode(seed, nodeIndex, nodeType, act) {
  if (nodeType !== "battle" || nodeIndex <= 1) return buildObjectiveSpec("kill", act)
  const rng = streamRng(seed, "combat", `${nodeIndex}:objective`)
  const special = rng() < specialObjectiveChance(act)
  const typeRoll = rng()
  const kindRoll = rng()
  const reinforceRoll = rng()
  const type = special ? ["survive", "protect", "totem"][Math.floor(typeRoll * 3)] : "kill"
  // Reinforcements modifier on other fight types: from Act II, 11% +4pp/Act.
  const reinforce = type !== "survive" && act >= 2 && reinforceRoll < 0.03 + 0.04 * act ? { turn: 3, count: act >= 5 ? 2 : 1 } : null
  return buildObjectiveSpec(type, act, { pulseKind: kindRoll < 0.5 ? "mend" : "blast", reinforce })
}

// One short line, for the formation screen.
export function objectiveSummary(spec) {
  if (!spec) return OBJECTIVE_NAMES.kill
  const extra = spec.reinforce ? ` · reinforcements on turn ${spec.reinforce.turn}` : ""
  if (spec.type === "survive") return `Survive ${spec.turns} turns with your Commander alive${extra}`
  if (spec.type === "protect") return `Protect the Wandering Seer - if it falls, the fight is lost${extra}`
  if (spec.type === "totem") {
    const fx = spec.pulseKind === "blast" ? `strikes your whole squad for ${spec.pulseAmount}` : `mends every enemy for ${spec.pulseAmount} and makes them stronger`
    return `Destroy the Totem - every ${spec.pulseEvery} turns it ${fx}${extra}`
  }
  return `${OBJECTIVE_NAMES.kill}${extra}`
}

function occupied(state, pos) {
  return state.units.some((u) => u.hp > 0 && u.pos.row === pos.row && u.pos.col === pos.col)
}

// First free, walkable tile scanning `cols` outward from `row`.
function freeTile(state, cols, row) {
  const rows = state.grid.rows
  for (const col of cols) {
    for (let d = 0; d < rows; d++) {
      for (const r of d === 0 ? [row] : [row - d, row + d]) {
        if (r < 0 || r >= rows) continue
        const t = state.terrain?.[`${r}-${col}`]
        if (t === "water" || t === "rock") continue
        if (!occupied(state, { row: r, col })) return { row: r, col }
      }
    }
  }
  return null
}

function staticPatch(extra) {
  return { move: 0, range: 0, attack: 0, baseAttack: 0, ap: 0, apMax: 0, ...extra }
}

// Puts the spec onto a freshly built battle (NPC/totem pieces +
// reinforcement templates). Kill-all without reinforcements = unchanged.
export function applyObjective(battle, spec) {
  if (!battle || !spec) return battle
  const { cols, rows } = battle.grid
  const mid = Math.floor(rows / 2)
  let units = battle.units
  const objective = { type: spec.type, act: spec.act, reinforcements: null }
  const lines = []
  if (spec.type === "survive") {
    objective.turns = spec.turns
    lines.push(`Objective: survive ${spec.turns} turns - keep your Commander alive.`)
  } else if (spec.type === "protect") {
    const pos = freeTile(battle, [cols - 2, cols - 3], mid)
    const npc = deriveTacticsUnit("objective-seer", "player", pos, NPC_ID, { name: "Wandering Seer", art: "the-star", maxHp: spec.npcHp })
    units = [...units, { ...npc, ...staticPatch({ npc: true }) }]
    objective.npcId = NPC_ID
    lines.push("Objective: protect the Wandering Seer and defeat every enemy.")
  } else if (spec.type === "totem") {
    const pos = freeTile(battle, [1, 2], mid)
    const totem = deriveTacticsUnit("objective-totem", "enemy", pos, TOTEM_ID, { name: "Blight Totem", art: "rune", maxHp: spec.totemHp })
    units = [...units, { ...totem, ...staticPatch({ structure: true }) }]
    Object.assign(objective, { totemId: TOTEM_ID, pulseEvery: spec.pulseEvery, nextPulseTurn: spec.pulseEvery, pulseKind: spec.pulseKind, pulseAmount: spec.pulseAmount })
    lines.push("Objective: destroy the Totem - it wins the fight even if enemies remain.")
  }
  let next = { ...battle, units }
  if (spec.reinforce) {
    // Clones of the weakest ordinary enemy on the field (keeps the run's
    // difficulty scaling), arriving at the enemy's edge.
    const pool = units.filter((u) => u.side === "enemy" && !u.structure && !(u.phases?.length) && !u.aoeMove)
    const template = pool.reduce((best, u) => (!best || u.maxHp < best.maxHp ? u : best), null)
    if (template) {
      const edgeRows = [0, rows - 1, 1, rows - 2]
      const tiles = []
      for (let i = 0; i < spec.reinforce.count; i++) tiles.push({ row: edgeRows[i % edgeRows.length], col: 0 })
      objective.reinforcements = {
        turn: spec.reinforce.turn,
        tiles,
        templates: tiles.map(() => ({ ...template, hp: template.maxHp, attack: template.baseAttack ?? template.attack })),
        arrived: false,
      }
      lines.push(`Enemy reinforcements arrive on turn ${spec.reinforce.turn}.`)
    }
  }
  if (objective.type === "kill" && !objective.reinforcements) return battle
  return { ...next, objective, log: [...next.log, ...lines] }
}

// ---- engine hooks ----

// Objective-specific end conditions, checked before the default ones.
// Returns null (no verdict) or { phase, line }.
export function objectiveVerdict(state) {
  const obj = state.objective
  if (!obj) return null
  if (obj.type === "protect" && !(getUnit(state, obj.npcId)?.hp > 0)) return { phase: "lost", line: "The Wandering Seer has fallen. The fight is lost." }
  if (obj.type === "totem" && !(getUnit(state, obj.totemId)?.hp > 0)) return { phase: "won", line: "The Totem shatters! Victory." }
  if (obj.type === "survive") {
    const commander = getUnit(state, "player-commander")
    if (commander && commander.hp <= 0) return { phase: "lost", line: "Your Commander has fallen. The fight is lost." }
  }
  return null
}

// Start of the enemy phase: the Totem pulses on its turn.
export function objectiveEnemyPhaseStart(state) {
  const obj = state.objective
  if (!obj || obj.type !== "totem" || state.turn < obj.nextPulseTurn) return state
  const totem = getUnit(state, obj.totemId)
  let next = { ...state, objective: { ...obj, nextPulseTurn: obj.nextPulseTurn + obj.pulseEvery } }
  if (!totem || totem.hp <= 0) return next
  next = emit(next, { kind: "reaction", unitId: totem.id, label: obj.pulseKind === "blast" ? "Totem blast!" : "Totem mends!" })
  if (obj.pulseKind === "blast") {
    next = emit({ ...next, log: [...next.log, `The ${totem.name} pulses - ${obj.pulseAmount} damage to your whole side!`] }, { kind: "aoe", actorId: totem.id })
    for (const target of livingUnits(next, "player")) {
      next = applyDamageWithBlock(next, target.id, obj.pulseAmount).next
    }
    return checkTacticsBattleEnd(next)
  }
  next = { ...next, log: [...next.log, `The ${totem.name} pulses - every enemy mends ${obj.pulseAmount} and grows stronger!`] }
  for (const e of livingUnits(next, "enemy")) {
    if (e.structure) continue
    const healed = Math.min(e.maxHp, e.hp + obj.pulseAmount)
    next = setUnit(next, e.id, { hp: healed, attack: e.attack + 1 })
    if (healed > e.hp) next = emit(next, { kind: "heal", targetId: e.id, amount: healed - e.hp })
  }
  return next
}

// A new player turn has just begun (state.turn already advanced):
// Survive completes, reinforcements arrive.
export function objectiveNewTurn(state) {
  const obj = state.objective
  if (!obj) return state
  if (obj.type === "survive" && state.turn > obj.turns) {
    return { ...state, turn: obj.turns, phase: "won", log: [...state.log, `You held for ${obj.turns} turns. Victory!`] }
  }
  const reinf = obj.reinforcements
  if (!reinf || reinf.arrived || state.turn < reinf.turn) return state
  let next = { ...state, objective: { ...obj, reinforcements: { ...reinf, arrived: true } } }
  const names = []
  reinf.templates.forEach((tpl, i) => {
    const want = reinf.tiles[i]
    const pos = occupied(next, want) ? freeTile(next, [0, 1, 2], want.row) : want
    if (!pos) return
    const unit = { ...tpl, id: `enemy-${tpl.defId}-r${i}`, pos, facing: "E", ap: tpl.apMax, block: 0 }
    next = { ...next, units: [...next.units, unit] }
    next = emit(next, { kind: "reaction", unitId: unit.id, label: "Reinforcements!" })
    names.push(unit.name)
  })
  if (names.length) next = { ...next, log: [...next.log, `Enemy reinforcements arrive: ${names.join(", ")}!`] }
  return next
}

// ---- UI helpers ----

// Tiles to mark: only on the player turn right before arrival.
export function reinforcementWarningTiles(state) {
  const reinf = state.objective?.reinforcements
  if (!reinf || reinf.arrived || state.turn !== reinf.turn - 1) return []
  return reinf.tiles
}

export function turnsUntilPulse(state) {
  const obj = state.objective
  if (!obj || obj.type !== "totem") return null
  return Math.max(0, obj.nextPulseTurn - state.turn)
}

// { title, detail, extra } for the side panel.
export function describeObjective(state) {
  const obj = state.objective
  const title = obj ? OBJECTIVE_NAMES[obj.type] : OBJECTIVE_NAMES.kill
  let detail = "Win by clearing the field."
  if (obj?.type === "survive") {
    const shown = Math.min(state.turn, obj.turns)
    detail = `Turn ${shown} of ${obj.turns} - hold out with your Commander alive (or clear the field).`
  } else if (obj?.type === "protect") {
    const npc = getUnit(state, obj.npcId)
    detail = `Seer HP ${Math.max(0, npc?.hp || 0)}/${npc?.maxHp || 0} - if it falls, you lose. Clear the field to win.`
  } else if (obj?.type === "totem") {
    const n = turnsUntilPulse(state)
    const fx = obj.pulseKind === "blast" ? `hits your whole side for ${obj.pulseAmount}` : `mends every enemy ${obj.pulseAmount} and adds +1 attack`
    detail = `${n === 0 ? "It pulses at the end of this turn!" : `It pulses in ${n} turn${n === 1 ? "" : "s"}`} (${fx}). Break it to win.`
  }
  const reinf = obj?.reinforcements
  let extra = null
  if (reinf && !reinf.arrived) {
    extra = state.turn === reinf.turn - 1 ? "Reinforcements arrive next turn at the marked tiles!" : `Reinforcements arrive on turn ${reinf.turn}.`
  }
  return { type: obj?.type || "kill", title, detail, extra }
}
