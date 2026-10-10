// Hearthwood - HERO TRAITS rules (pure). Data: data/heartwood/traits.js.
// Purpose: roll 1-2 traits for a recruit, pass them on at the Nest, give
// / take them in events, and fold them onto a tactics unit at fight start.
// Stored on a bench / hearth entry as `heroTraits: [id, ...]` (missing =
// never rolled; [] = rolled, none). No battle-engine imports.
// Public API: rollTraits, withRolledTraits, inheritTraits, addTrait,
// removeTrait, traitFx, traitModsFor, applyTraitsToTactics, traitTitle.
import { TRAITS, MAX_TRAITS, TRAIT_ODDS } from "../../data/heartwood/traits"
import { streamRng } from "../../data/heartwood/seed"

const arr = (v) => (Array.isArray(v) ? v : [])

export function traitDefs(ids) {
  return arr(ids).map((id) => TRAITS[id]).filter(Boolean)
}

export function traitTitle(ids) {
  return traitDefs(ids).map((t) => `${t.icon} ${t.name}: ${t.text}`).join("\n")
}

// Seeded weighted pick among rollable traits (weight > 0).
export function pickTrait(rng, exclude = []) {
  const pool = Object.values(TRAITS).filter((t) => (t.weight || 0) > 0 && !exclude.includes(t.id))
  const total = pool.reduce((s, t) => s + t.weight, 0)
  if (!total) return null
  let roll = rng() * total
  for (const t of pool) {
    roll -= t.weight
    if (roll < 0) return t.id
  }
  return pool[pool.length - 1].id
}

export function addTrait(list, id) {
  const cur = arr(list)
  if (!TRAITS[id] || cur.includes(id) || cur.length >= MAX_TRAITS) return cur
  return [...cur, id]
}

export function removeTrait(list, id) {
  return arr(list).filter((x) => x !== id)
}

// 1 trait, plus a 2nd one with TRAIT_ODDS.second. Deterministic per salt.
export function rollTraits(seed, salt) {
  const rng = streamRng(seed || 0, "traits", String(salt))
  const first = pickTrait(rng)
  let out = first ? [first] : []
  if (rng() < TRAIT_ODDS.second) out = addTrait(out, pickTrait(rng, out))
  return out
}

// Every bench entry still missing `heroTraits` rolls its own (seeded by
// run seed + bench key + defId). Fusions inherit instead (runEngine).
export function withRolledTraits(runState) {
  if (!Array.isArray(runState?.bench) || !runState.bench.some((e) => !Array.isArray(e.heroTraits))) return runState
  return {
    ...runState,
    bench: runState.bench.map((e) => (Array.isArray(e.heroTraits) ? e : { ...e, heroTraits: rollTraits(runState.seed, `${e.key}:${e.defId}`) })),
  }
}

// The Nest: each parent trait passes with TRAIT_ODDS.inherit, plus a
// rare brand-new one. `rng` = the hatchling's own traits stream.
export function inheritTraits(rng, parentA, parentB) {
  let out = []
  const from = []
  for (const p of [parentA, parentB]) {
    for (const id of arr(p?.heroTraits)) {
      if (rng() < TRAIT_ODDS.inherit && !out.includes(id)) {
        const next = addTrait(out, id)
        if (next !== out) from.push({ id, hid: p.hid })
        out = next
      }
    }
  }
  let fresh = null
  if (rng() < TRAIT_ODDS.fresh) {
    fresh = pickTrait(rng, out)
    if (fresh) out = addTrait(out, fresh)
  }
  return { traits: out, from, fresh }
}

// --- In fight -------------------------------------------------------------------

// Sum of every trait's mutation-style fx.
export function traitFx(ids) {
  const out = {}
  for (const t of traitDefs(ids)) for (const [k, v] of Object.entries(t.fx || {})) if (typeof v === "number") out[k] = (out[k] || 0) + v
  return Object.keys(out).length ? out : null
}

// The conditional bonuses, as the unit's `extraMods` entries.
export function traitModsFor(ids) {
  return traitDefs(ids)
    .filter((t) => t.mods)
    .map((t) => ({ ...t.mods, label: t.name }))
}

// Run-level extras summed (essenceOnWin, xpBonus) + flags (stubborn, clumsy).
export function traitExtras(ids) {
  const out = {}
  for (const t of traitDefs(ids)) {
    for (const [k, v] of Object.entries(t.extra || {})) out[k] = typeof v === "number" ? (out[k] || 0) + v : v || out[k]
  }
  return out
}

// Fight-start fields on a tactics unit (the fx side goes through
// mutations.applyMutationsToTactics with the rest of the hero's quirks).
export function applyTraitsToTactics(u, ids) {
  const list = traitDefs(ids)
  if (!list.length) return u
  const extra = traitExtras(ids)
  const mods = traitModsFor(ids)
  return {
    ...u,
    heroTraits: list.map((t) => t.id),
    ...(mods.length ? { extraMods: [...arr(u.extraMods), ...mods] } : {}),
    ...(extra.stubborn ? { stubborn: true } : {}),
    ...(extra.clumsy ? { clumsy: true } : {}),
    ...(extra.essenceOnWin ? { traitEssence: extra.essenceOnWin } : {}),
    ...(extra.xpBonus ? { xpBonus: extra.xpBonus } : {}),
  }
}

// --- Events ---------------------------------------------------------------------------

// Event effect `{ trait: "random" | "random-good" | "random-bad" | <id>, who: "random" | "all" }`
// and `{ loseTrait: "random" | <id> }`. Deployed heroes first. Returns { runState, lines }.
export function eventTrait(runState, eff, rng, unitName) {
  const live = runState.bench.filter((e) => e && e.defId)
  const deployed = live.filter((e) => runState.deployed.includes(e.key))
  const pool = deployed.length ? deployed : live
  if (!pool.length) return { runState, lines: [] }
  const lines = []
  const patch = new Map()
  if (eff.loseTrait) {
    const holders = pool.filter((e) => arr(e.heroTraits).length && (eff.loseTrait === "random" || arr(e.heroTraits).includes(eff.loseTrait)))
    if (!holders.length) return { runState, lines }
    const e = holders[Math.floor(rng() * holders.length)]
    const id = eff.loseTrait === "random" ? arr(e.heroTraits)[Math.floor(rng() * e.heroTraits.length)] : eff.loseTrait
    patch.set(e.key, removeTrait(e.heroTraits, id))
    lines.push(`🧬 ${unitName(e)} loses ${TRAITS[id].icon} ${TRAITS[id].name}.`)
  } else {
    const can = pool.filter((e) => arr(e.heroTraits).length < MAX_TRAITS)
    if (!can.length) return { runState, lines }
    const targets = eff.who === "all" ? can : [can[Math.floor(rng() * can.length)]]
    const spec = String(eff.trait)
    for (const e of targets) {
      let id = null
      if (TRAITS[spec]) id = spec
      else {
        const kind = spec.startsWith("random-") ? spec.slice(7) : null
        const pool2 = Object.values(TRAITS).filter((t) => (t.weight || 0) > 0 && !arr(e.heroTraits).includes(t.id) && (!kind || t.kind === kind))
        id = pool2.length ? pool2[Math.floor(rng() * pool2.length)].id : null
      }
      if (!id || arr(e.heroTraits).includes(id)) continue
      patch.set(e.key, addTrait(e.heroTraits, id))
      lines.push(`🧬 ${unitName(e)} becomes ${TRAITS[id].icon} ${TRAITS[id].name}: ${TRAITS[id].text}`)
    }
  }
  if (!patch.size) return { runState, lines }
  return { runState: { ...runState, bench: runState.bench.map((e) => (patch.has(e.key) ? { ...e, heroTraits: patch.get(e.key) } : e)) }, lines }
}
