// Hearthwood - GEAR (the gear sprint): gear rows, Backpack-Battles
// adjacency, recipes, Class Collars and how all of it reaches a tactics
// fight. Pure, state in -> state out, deterministic. No runEngine import
// (runEngine imports this file).
//
// As a player reads it:
// - Every hero (and the Commander) carries a ROW of gear slots (5, more
//   with Artificer's Ledger / Deep Pockets). Any item fits any slot.
// - ROW ADJACENCY: some items help the item NEXT TO them in the row
//   (Whetstone next to a blade = +2 attack; Mana Gem next to a staff =
//   +2 resource a turn; Rune Stone next to a charm = that charm +50%).
//   Rearranging the row is the puzzle.
// - BOARD AURAS: some items help allies standing next to the wearer on
//   the battle board (War Banner +10% to hit, Incense Burner +5 resource
//   a turn, Watch Lantern = can't be flanked, Warding Bell = 1 less
//   damage per hit).
// - RECIPES (data/heartwood/recipes.js): two ingredients side by side in
//   one row fuse into a stronger item; a same-item recipe also fuses on
//   buying the second copy.
// - CLASS COLLARS: a hero wearing one fights as that class (skills,
//   passive and resource); natural class returns when it comes off.
//
// Item instance (runState.items[i]): { key, defId, equippedTo, slotIndex }.
import { ITEMS, ITEM_SLOTS } from "../../data/heartwood/items"
import { RECIPES } from "../../data/heartwood/recipes"
import { CLASSES } from "../../data/heartwood/classes"

// --- fx vocabulary ------------------------------------------------------------
// Same names as mutations (hp, attack, aim, regen, manaMax...) plus the
// resource-gear extras. Shown in plain English on cards and in the Studio.
export const GEAR_FX_TEXT = {
  hp: (n) => `${n > 0 ? "+" : ""}${n} max HP`,
  attack: (n) => `${n > 0 ? "+" : ""}${n} attack`,
  aim: (n) => `${n > 0 ? "+" : ""}${n}% to hit`,
  move: (n) => `${n > 0 ? "+" : ""}${n} movement`,
  ward: (n) => `shrugs off ${n} hit${n > 1 ? "s" : ""}`,
  evade: (n) => `dodges ${n} hit${n > 1 ? "s" : ""}`,
  thorns: (n) => `strikes back for ${n}`,
  regen: (n) => `mends ${n} HP a turn`,
  block: (n) => `+${n} Block a turn`,
  leech: (n) => `heals ${n} per hit`,
  manaMax: (n) => `${n > 0 ? "+" : ""}${n} max resource`,
  manaRegen: (n) => `${n > 0 ? "+" : ""}${n} resource a turn`,
  manaStartPct: (n) => `starts fights +${n}% resource`,
  resGain: (n) => `+${n} on every resource gain`,
  highDmg: (n) => `+${n} damage at half bar`,
  highAim: (n) => `+${n}% to hit at half bar`,
  overflow: (n) => `stores ${n} overflow`,
  tapRes: (n) => `+${n} resource a turn (costs HP)`,
  tapHp: () => "",
  upkeep: (n) => `summons hold back ${n} less`,
  cheaper: (n) => `skills ${n}% cheaper`,
  hurtGain: (n) => `+${n} resource when hit`,
  highAt: () => "",
}
const RES_KEYS = new Set(["manaMax", "manaRegen", "manaStartPct", "resGain", "overflow", "tapRes", "upkeep", "cheaper", "hurtGain"])
// Thresholds / costs: never scaled by Rune boosts or half strength.
const FIXED_KEYS = new Set(["highAt", "tapHp"])

export function fxText(fx) {
  return Object.entries(fx || {})
    .filter(([k, v]) => v && GEAR_FX_TEXT[k] && GEAR_FX_TEXT[k](v))
    .map(([k, v]) => GEAR_FX_TEXT[k](v))
    .join(", ")
}

// --- rows ---------------------------------------------------------------------

export const COMMANDER_KEY = "commander"

// The owner's row, one entry per slot: the item instance or null. Items
// equipped without a slot index (hand-built test states) fill the first
// free slots in key order.
export function gearRow(items, ownerKey, slots = ITEM_SLOTS) {
  const mine = (items || []).filter((it) => it.equippedTo === ownerKey && ITEMS[it.defId])
  const n = Math.max(slots, ...mine.map((it) => (Number.isInteger(it.slotIndex) ? it.slotIndex + 1 : 0)))
  const row = Array.from({ length: n }, () => null)
  for (const it of mine) if (Number.isInteger(it.slotIndex) && it.slotIndex >= 0 && !row[it.slotIndex]) row[it.slotIndex] = it
  for (const it of mine) {
    if (row.includes(it)) continue
    const free = row.indexOf(null)
    if (free === -1) row.push(it)
    else row[free] = it
  }
  return row
}

const defOf = (it) => (it ? ITEMS[it.defId] || null : null)

function matches(match, def) {
  if (!match || !def) return false
  if (match.kind && def.kind === match.kind) return true
  if (match.tag && (def.tags || []).includes(match.tag)) return true
  return false
}

// Adjacency links in one row: [{ from, to, text, bonus?, boost? }] -
// item `from` gets its bonus because item `to` sits right beside it.
export function adjacencyLinks(defs) {
  const links = []
  defs.forEach((def, i) => {
    if (!def?.adj) return
    for (const j of [i - 1, i + 1]) {
      const n = defs[j]
      if (n && matches(def.adj.match, n)) links.push({ from: i, to: j, text: def.adj.text || "", bonus: def.adj.bonus || null, boost: def.adj.boost || 0 })
    }
  })
  return links
}

function addFx(out, fx, scale = 1, half = false) {
  for (const [k, v] of Object.entries(fx || {})) {
    if (typeof v !== "number" || !v) continue
    if (FIXED_KEYS.has(k)) {
      out[k] = k === "highAt" ? Math.min(out[k] ?? 100, v) : Math.max(out[k] || 0, v)
      continue
    }
    let n = v * scale
    if (half && RES_KEYS.has(k)) n = n / 2
    n = Math.sign(n) * Math.max(1, Math.round(Math.abs(n)))
    out[k] = (out[k] || 0) + n
  }
}

// Everything one row gives its wearer: summed fx, board auras, links,
// and per-slot boost %. `resourceId` = the wearer's resource ("rage"...)
// for items with a `res` restriction (half strength on others).
export function rowEffects(row, resourceId = null) {
  const defs = row.map(defOf)
  const links = adjacencyLinks(defs)
  const boosts = {}
  for (const l of links) if (l.boost) boosts[l.to] = (boosts[l.to] || 0) + l.boost
  const fx = {}
  const auras = []
  defs.forEach((def, i) => {
    if (!def) return
    const scale = 1 + (boosts[i] || 0) / 100
    const half = !!(def.res?.length && resourceId && !def.res.includes(resourceId))
    addFx(fx, def.fx, scale, half)
    if (def.aura) {
      const amount = def.aura.type === "noFlank" ? 1 : Math.max(1, Math.round((def.aura.amount || 0) * scale))
      auras.push({ type: def.aura.type, amount, name: def.name, itemId: def.id })
    }
  })
  for (const l of links) if (l.bonus) addFx(fx, l.bonus)
  return { fx, auras, links, boosts }
}

// --- collars ------------------------------------------------------------------

export function collarIn(items, ownerKey) {
  const it = (items || []).find((x) => x.equippedTo === ownerKey && ITEMS[x.defId]?.kind === "collar")
  return it ? ITEMS[it.defId] : null
}

// The class a bench hero fights as: its collar's while one is worn, else null.
export function collarClassFor(runState, benchKey) {
  if (benchKey === COMMANDER_KEY) return null
  const c = collarIn(runState?.items, benchKey)
  return c && CLASSES[c.collarClass] ? c.collarClass : null
}

// Why an item can't go into that owner's row (plain English), or null.
export function equipBlocker(runState, itemKey, ownerKey) {
  const item = (runState.items || []).find((it) => it.key === itemKey)
  const def = defOf(item)
  if (!def) return "Unknown item."
  if (def.kind !== "collar") return null
  if (ownerKey === COMMANDER_KEY) return "The Commander can't wear a Class Collar."
  const other = (runState.items || []).find((it) => it.key !== itemKey && it.equippedTo === ownerKey && ITEMS[it.defId]?.kind === "collar")
  return other ? "A hero can wear only one collar - take the other one off first." : null
}

// --- recipes ------------------------------------------------------------------

export function recipeFor(aId, bId) {
  return Object.values(RECIPES).find((r) => (r.a === aId && r.b === bId) || (r.a === bId && r.b === aId)) || null
}

// Recipes an item is part of (the card's "Combines:" hint).
export function recipesUsing(itemId) {
  return Object.values(RECIPES).filter((r) => r.a === itemId || r.b === itemId)
}

function noteRecipe(runState, recipe, ownerKey, resultKey) {
  const found = runState.recipesFound || []
  return {
    ...runState,
    recipesFound: found.includes(recipe.id) ? found : [...found, recipe.id],
    lastCombined: { recipeId: recipe.id, result: recipe.result, owner: ownerKey, key: resultKey },
  }
}

// Fuses every adjacent recipe pair in the owner's row (left slot keeps
// the result). Repeats until nothing more combines.
export function combineRow(runState, ownerKey, slots = ITEM_SLOTS) {
  let rs = runState
  for (let guard = 0; guard < 8; guard++) {
    const row = gearRow(rs.items, ownerKey, slots)
    let hit = null
    for (let i = 0; i < row.length - 1 && !hit; i++) {
      if (!row[i] || !row[i + 1]) continue
      const r = recipeFor(row[i].defId, row[i + 1].defId)
      if (r && ITEMS[r.result]) hit = { i, r }
    }
    if (!hit) return rs
    const left = row[hit.i]
    const right = row[hit.i + 1]
    const key = rs.itemKeyCounter
    const items = rs.items
      .filter((it) => it.key !== left.key && it.key !== right.key)
      .concat({ key, defId: hit.r.result, equippedTo: ownerKey, slotIndex: hit.i })
    rs = noteRecipe({ ...rs, items, itemKeyCounter: key + 1 }, hit.r, ownerKey, key)
  }
  return rs
}

// Buying a second copy of a same-item recipe ingredient fuses at once:
// the copy you already had becomes the result (keeping its slot).
export function combineDuplicate(runState, newItemKey, slots = ITEM_SLOTS) {
  const fresh = (runState.items || []).find((it) => it.key === newItemKey)
  if (!fresh) return runState
  const r = recipeFor(fresh.defId, fresh.defId)
  if (!r || r.a !== r.b || !ITEMS[r.result]) return runState
  const old = runState.items.find((it) => it.key !== newItemKey && it.defId === fresh.defId)
  if (!old) return runState
  const key = runState.itemKeyCounter
  const items = runState.items
    .filter((it) => it.key !== newItemKey && it.key !== old.key)
    .concat({ key, defId: r.result, equippedTo: old.equippedTo, slotIndex: old.slotIndex })
  const rs = noteRecipe({ ...runState, items, itemKeyCounter: key + 1 }, r, old.equippedTo, key)
  return old.equippedTo != null ? combineRow(rs, old.equippedTo, slots) : rs
}

// --- tactics ------------------------------------------------------------------

// Folds a row's fx onto a tactics unit (after levels / mutations / mana).
export function applyGearFx(u, fx, auras = [], itemIds = []) {
  const next = { ...u }
  if (itemIds.length) next.gearIds = itemIds
  if (auras.length) next.gearAuras = auras
  if (!fx || !Object.keys(fx).length) return next
  if (fx.hp) {
    const maxHp = Math.max(1, u.maxHp + fx.hp)
    next.maxHp = maxHp
    next.hp = Math.max(1, Math.min(maxHp, fx.hp > 0 ? u.hp + fx.hp : u.hp))
  }
  if (fx.attack) {
    next.attack = Math.max(0, u.attack + fx.attack)
    next.baseAttack = Math.max(0, (u.baseAttack ?? u.attack) + fx.attack)
  }
  if (fx.move) next.move = Math.max(1, (u.move || 1) + fx.move)
  if (fx.ward) next.ward = Math.max(0, (u.ward || 0) + fx.ward)
  if (fx.evade) next.evade = Math.max(0, (u.evade || 0) + fx.evade)
  if (fx.aim) next.gearAim = (u.gearAim || 0) + fx.aim
  if (fx.leech > 0) next.mutLeech = (u.mutLeech || 0) + fx.leech
  const triggers = [...(u.triggers || [])]
  if (fx.thorns > 0) triggers.push({ trigger: "onHit", effect: { type: "damage", amount: fx.thorns }, source: "Gear" })
  if (fx.regen > 0) triggers.push({ trigger: "turnStart", effect: { type: "heal", amount: fx.regen }, source: "Gear" })
  if (fx.block > 0) triggers.push({ trigger: "turnStart", effect: { type: "block", amount: fx.block }, source: "Gear" })
  if (triggers.length !== (u.triggers || []).length) next.triggers = triggers
  // Resources: only when the fight runs with them (the unit has `manaMax`).
  if (typeof u.manaMax === "number" && !u.reagents) {
    const max0 = u.manaMax
    let max = max0
    let mana = u.mana
    if (fx.manaMax) {
      const d = max0 < 40 ? Math.sign(fx.manaMax) * Math.max(1, Math.round((Math.abs(fx.manaMax) * max0) / 100)) : fx.manaMax
      max = Math.max(1, max0 + d)
      mana = d > 0 && u.mana >= max0 ? u.mana + d : Math.min(max, u.mana)
    }
    if (fx.manaStartPct) mana = Math.min(max, mana + Math.round((max * fx.manaStartPct) / 100))
    next.manaMax = max
    next.mana = Math.max(0, Math.min(max, mana))
    if (fx.manaRegen) next.manaRegenBonus = (u.manaRegenBonus || 0) + fx.manaRegen
  }
  if (typeof u.manaMax === "number") {
    if (fx.resGain) next.gearResGain = fx.resGain
    if (fx.highDmg || fx.highAim) Object.assign(next, { gearHighAt: fx.highAt || 50, gearHighDmg: fx.highDmg || 0, gearHighAim: fx.highAim || 0 })
    if (fx.overflow) next.gearOverflow = fx.overflow
    if (fx.tapRes) Object.assign(next, { gearTapHp: fx.tapHp || 0, gearTapRes: fx.tapRes })
    if (fx.upkeep) next.gearUpkeep = fx.upkeep
    if (fx.cheaper) next.gearCheaper = Math.min(60, fx.cheaper)
    if (fx.hurtGain) next.gearHurtGain = fx.hurtGain
  }
  return next
}

// Tactics unit id -> run owner key (bench key or "commander").
export function ownerKeysForBattle(battle, runState) {
  const keys = (runState.deployed || []).filter((k) => k !== null && (runState.bench || []).some((e) => e.key === k))
  const out = {}
  keys.forEach((k, i) => {
    const e = runState.bench.find((b) => b.key === k)
    out[`player-${e.defId}-${i}`] = k
  })
  out["player-commander"] = COMMANDER_KEY
  return out
}

// Called by runEngine.startTacticsFormationBattle on the built battle.
export function applyGearToBattle(battle, runState, slots = ITEM_SLOTS) {
  if (!battle?.units || !(runState?.items || []).length) return battle
  const owners = ownerKeysForBattle(battle, runState)
  return {
    ...battle,
    units: battle.units.map((u) => {
      const key = owners[u.id]
      if (key === undefined) return u
      const row = gearRow(runState.items, key, slots)
      if (!row.some(Boolean)) return u
      const { fx, auras } = rowEffects(row, u.resource || null)
      return applyGearFx(u, fx, auras, row.filter(Boolean).map((it) => it.defId))
    }),
  }
}

// --- board auras (read live by the engine: preview == real) -------------------

const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))

// The aura amount of `type` the unit gets from allies standing next to it.
export function auraOn(state, unit, type, pos = unit?.pos) {
  if (!state?.units || !unit || !pos) return 0
  let sum = 0
  for (const w of state.units) {
    if (w.id === unit.id || w.hp <= 0 || w.side !== unit.side || !w.gearAuras?.length) continue
    if (cheb(w.pos, pos) !== 1) continue
    for (const a of w.gearAuras) if (a.type === type) sum += a.amount
  }
  return sum
}

// Tiles lit by each aura wearer (TacticsBoard outlines). Map key -> type.
export function auraTiles(state) {
  const out = new Map()
  for (const w of state?.units || []) {
    if (w.hp <= 0 || !w.gearAuras?.length) continue
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue
        const r = w.pos.row + dr
        const c = w.pos.col + dc
        if (r < 0 || c < 0 || r >= (state.grid?.rows || 99) || c >= (state.grid?.cols || 99)) continue
        if (!out.has(`${r}-${c}`)) out.set(`${r}-${c}`, w.gearAuras[0].type)
      }
  }
  return out
}

export const AURA_LABEL = {
  aim: (n) => `+${n}% to hit`,
  res: (n) => `+${n} resource a turn`,
  noFlank: () => "can't be flanked",
  guard: (n) => `takes ${n} less per hit`,
}
