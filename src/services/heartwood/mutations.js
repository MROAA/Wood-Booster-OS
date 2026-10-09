// Hearthwood - MUTATIONS rules (pure). Data: data/heartwood/mutations.js.
// Responsibilities:
// - pick / add mutations (seeded rng in, no Math.random)
// - fold a hero's mutations (+ breeding traits) onto a built tactics
//   unit at fight start (called from unitLevels.applyLevelsToTactics)
// - roll mutations gained after a won run fight (runEngine)
// - give mutations from map events (runEngine applyEventEffect)
// The in-fight reactions (element on hit, leech, gills, echo) live in
// tacticsMutations.js; this file never imports either battle engine.
// Stored on a bench / hearth entry as `mutations: [id, ...]` (missing = none).
import { MUTATIONS, MAX_MUTATIONS, MUTATION_ODDS } from "../../data/heartwood/mutations"
import { UNITS } from "../../data/heartwood/units"
import { streamRng } from "../../data/heartwood/seed"

const arr = (v) => (Array.isArray(v) ? v : [])

export function mutationDefs(ids) {
  return arr(ids).map((id) => MUTATIONS[id]).filter(Boolean)
}

// One line per mutation: "🌿 Mossy Hide - ..." (tooltips).
export function mutationTitle(ids) {
  return mutationDefs(ids).map((m) => `${m.icon} ${m.name} (${m.kind}): ${m.text}`).join("\n")
}

// Seeded weighted pick. `kind` = "good" | "mixed" | "bad" | "any" | ["good","mixed"].
export function pickMutation(rng, { kind = "any", exclude = [] } = {}) {
  const kinds = kind === "any" ? null : Array.isArray(kind) ? kind : [kind]
  const pool = Object.values(MUTATIONS).filter((m) => (m.weight || 0) > 0 && !exclude.includes(m.id) && (!kinds || kinds.includes(m.kind)))
  const total = pool.reduce((s, m) => s + m.weight, 0)
  if (!total) return null
  let roll = rng() * total
  for (const m of pool) {
    roll -= m.weight
    if (roll < 0) return m.id
  }
  return pool[pool.length - 1].id
}

// Adds one mutation (no duplicates, capped). Returns the same array when full.
export function addMutation(list, id) {
  const cur = arr(list)
  if (!MUTATIONS[id] || cur.includes(id) || cur.length >= MAX_MUTATIONS) return cur
  return [...cur, id]
}

export function canMutate(list) {
  return arr(list).length < MAX_MUTATIONS
}

// --- In fight -------------------------------------------------------------------

// Sum of every mutation's fx (+ optional extra fx: breeding bias/affinity).
export function mutationFx(ids, extra = null) {
  const out = {}
  const add = (fx) => {
    for (const [k, v] of Object.entries(fx || {})) if (typeof v === "number") out[k] = (out[k] || 0) + v
  }
  for (const m of mutationDefs(ids)) add(m.fx)
  if (extra) add(extra)
  return out
}

// Amounts written for a 100-ish bar, scaled for small pools (pips / counters).
function scaleRes(max, n) {
  if (!n || (max || 0) >= 40) return n
  const s = Math.round((Math.abs(n) * (max || 0)) / 100)
  return Math.sign(n) * Math.max(1, s)
}

// Folds mutations onto a built tactics unit. `extra` = breeding fx
// ({ hp, attack, manaMax, manaRegen }). Pure - unit in, unit out.
export function applyMutationsToTactics(u, ids, extra = null) {
  const list = mutationDefs(ids)
  if (!list.length && !extra) return u
  const fx = mutationFx(ids, extra)
  const next = { ...u }
  if (list.length) {
    next.mutations = list.map((m) => m.id)
  }
  // HP: flat + % of max.
  const hpDelta = (fx.hp || 0) + Math.round(((u.maxHp || 0) * (fx.hpPct || 0)) / 100)
  if (hpDelta) {
    const maxHp = Math.max(1, u.maxHp + hpDelta)
    next.maxHp = maxHp
    next.hp = Math.max(1, Math.min(maxHp, hpDelta > 0 ? u.hp + hpDelta : u.hp))
  }
  if (fx.attack) {
    next.attack = Math.max(0, u.attack + fx.attack)
    next.baseAttack = Math.max(0, (u.baseAttack ?? u.attack) + fx.attack)
  }
  if (fx.move) next.move = Math.max(1, (u.move || 1) + fx.move)
  if (fx.range && (u.range || 1) > 1) next.range = Math.max(2, u.range + fx.range)
  if (fx.apStart) next.ap = Math.max(0, (u.ap || 0) + fx.apStart)
  if (fx.ward) next.ward = Math.max(0, (u.ward || 0) + fx.ward)
  if (fx.evade) next.evade = Math.max(0, (u.evade || 0) + fx.evade)
  if (fx.aim) next.mutAim = fx.aim
  // Triggers on the engine's existing channels (source = the mutation's name).
  const src = (key) => list.find((m) => m.fx?.[key])?.name || "Mutation"
  const triggers = [...(u.triggers || [])]
  if (fx.thorns > 0) triggers.push({ trigger: "onHit", effect: { type: "damage", amount: fx.thorns }, source: src("thorns") })
  if (fx.regen > 0) triggers.push({ trigger: "turnStart", effect: { type: "heal", amount: fx.regen }, source: src("regen") })
  if (fx.block > 0) triggers.push({ trigger: "turnStart", effect: { type: "block", amount: fx.block }, source: src("block") })
  if (triggers.length !== (u.triggers || []).length) next.triggers = triggers
  // Element on hit / leech / gills / echo: read by tacticsMutations.js.
  const hit = {}
  for (const el of ["fire", "frost", "poison", "nature"]) if (fx[`${el}OnHit`] > 0) hit[el] = fx[`${el}OnHit`]
  if (Object.keys(hit).length) next.mutHit = hit
  if (fx.leech > 0) next.mutLeech = fx.leech
  if (fx.echo > 0) next.mutEcho = fx.echo
  // Resources: only when the fight runs with them (the unit has `manaMax`).
  if (typeof u.manaMax === "number" && !u.reagents) {
    const max0 = u.manaMax
    let max = max0
    let mana = u.mana
    if (fx.manaMax) {
      const d = scaleRes(max0, fx.manaMax)
      max = Math.max(1, max0 + d)
      mana = d > 0 && u.mana >= max0 ? u.mana + d : Math.min(max, u.mana)
    }
    if (fx.manaStartPct) mana = Math.min(max, mana + Math.round((max * fx.manaStartPct) / 100))
    next.manaMax = max
    next.mana = Math.max(0, Math.min(max, mana))
    if (fx.manaRegen) next.manaRegenBonus = (u.manaRegenBonus || 0) + fx.manaRegen
  }
  // Gills: a 100-bar amount, scaled by tacticsMana.gainExternal at gain time.
  if (typeof u.manaMax === "number" && fx.gills > 0) next.mutGills = fx.gills
  return next
}

// --- Gained in a run --------------------------------------------------------------

const BIG_FIGHTS = new Set(["elite", "miniboss", "boss"])

// After a WON run fight: each surviving deployed hero may grow one
// mutation. `node` = the run node fought. Returns { runState, lines }.
export function rollFightMutations(runState, battle, node) {
  const list = Array.isArray(battle?.units) ? battle.units : null
  if (!list || !Array.isArray(runState?.bench)) return { runState, lines: [] }
  const keys = runState.deployed.filter((k) => k !== null && runState.bench.some((e) => e.key === k))
  const corrupted = battle.faction === "corrupted"
  const big = BIG_FIGHTS.has(node?.type)
  const lines = []
  const bench = runState.bench.map((e) => {
    const i = keys.indexOf(e.key)
    if (i === -1 || !canMutate(e.mutations)) return e
    const u = list.find((x) => x.id === `player-${e.defId}-${i}`)
    if (!u || u.hp <= 0) return e
    const onBlight = !!battle.blight?.[`${u.pos?.row}-${u.pos?.col}`]
    const killed = (u.kills || 0) > 0
    const rng = streamRng(runState.seed || 0, "mutation", `${runState.nodeIndex}:${e.key}`)
    const roll = rng()
    let kind = null
    let why = ""
    if (big && killed && roll < MUTATION_ODDS.bigKill) {
      kind = "good"
      why = "the kill in a big fight changed it"
    } else if (corrupted && roll < MUTATION_ODDS.corrupted + (onBlight ? MUTATION_ODDS.blight : 0)) {
      kind = "any"
      why = onBlight ? "it stood on Blight too long" : "the Corruption seeped in"
    } else if (roll < MUTATION_ODDS.base) {
      kind = "any"
      why = "something in the forest got into it"
    }
    if (!kind) return e
    const id = pickMutation(rng, { kind, exclude: arr(e.mutations) })
    if (!id) return e
    const m = MUTATIONS[id]
    lines.push(`🧬 ${UNITS[e.defId]?.name || e.defId} grew ${m.name} - ${why}. ${m.text}`)
    return { ...e, mutations: addMutation(e.mutations, id) }
  })
  if (!lines.length) return { runState, lines }
  return { runState: { ...runState, bench }, lines }
}

// Event effect `{ mutation: "random" | "random-good" | "random-bad" | "random-mixed" | <id>, who: "random" | "all" }`.
// Heroes on the field first (deployed), else anyone on the bench. Returns { runState, lines }.
export function eventMutation(runState, eff, rng) {
  const deployed = runState.bench.filter((e) => runState.deployed.includes(e.key) && UNITS[e.defId])
  const pool = (deployed.length ? deployed : runState.bench.filter((e) => UNITS[e.defId])).filter((e) => canMutate(e.mutations))
  if (!pool.length) return { runState, lines: [] }
  const targets = eff.who === "all" ? pool : [pool[Math.floor(rng() * pool.length)]]
  const spec = String(eff.mutation)
  const kind = spec === "random" ? "any" : spec.startsWith("random-") ? spec.slice(7) : null
  const lines = []
  const got = new Map()
  for (const e of targets) {
    const id = kind ? pickMutation(rng, { kind, exclude: arr(e.mutations) }) : MUTATIONS[spec] ? spec : null
    if (!id || arr(e.mutations).includes(id)) continue
    got.set(e.key, id)
    lines.push(`🧬 ${UNITS[e.defId]?.name || e.defId} grows ${MUTATIONS[id].name}: ${MUTATIONS[id].text}`)
  }
  if (!got.size) return { runState, lines }
  return {
    runState: { ...runState, bench: runState.bench.map((e) => (got.has(e.key) ? { ...e, mutations: addMutation(e.mutations, got.get(e.key)) } : e)) },
    lines,
  }
}
