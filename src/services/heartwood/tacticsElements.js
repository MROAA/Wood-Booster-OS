// Hearthwood Frontier - element combos (sprint 3).
// Four elements live on units as plain status counters:
//   Fire   -> `burn`     (ticks at its turn start, halves)
//   Frost  -> `chill`    (stays; 2 Chill = Frozen)
//   Poison -> `poison`   (ticks, -1 per tick)
//   Nature -> `entangle` (lasts 2 of its own turns)
// Landing an element on a unit that already carries a partner fires ONE
// combo (first match in COMBOS order). Frozen = skip the next own turn,
// and the next hit before that deals +50% and thaws it (Shatter).
// Deterministic, pure (state in, state out). Engine helpers are imported
// back from tacticsEngine.js (circular, call-time only - same as
// tacticsRelics.js).
import { kingAdjacent } from "./targeting"
import {
  emit,
  getUnit,
  setUnit,
  livingUnits,
  applyDamageWithBlock,
  checkTacticsBattleEnd,
  checkEnemyPhase,
  trySpawnBrood,
} from "./tacticsEngine"

export const ELEMENTS = {
  fire: { status: "burn", name: "Fire", word: "Burning", icon: "🔥" },
  frost: { status: "chill", name: "Frost", word: "Chilled", icon: "❄" },
  poison: { status: "poison", name: "Poison", word: "Poisoned", icon: "☠" },
  nature: { status: "entangle", name: "Nature", word: "Entangled", icon: "🌿" },
}
const STATUS_TO_ELEMENT = { burn: "fire", chill: "frost", poison: "poison", entangle: "nature", root: "nature" }
export const ENTANGLE_DURATION = 2
export const FREEZE_AT = 2
export const SHATTER_MULT = 1.5
export const ROT_MAX_HP = 4

// Player-facing combo list (help panel + token tooltips).
export const COMBO_HELP = [
  { id: "toxic-blaze", name: "Toxic Blaze", recipe: "Fire + Poison", text: "Both burn off in a blast: damage equal to Burn + Poison to the target, half to units next to it." },
  { id: "steam", name: "Steam", recipe: "Fire + Frost", text: "Fire and frost cancel out in a cloud of steam - the target and units next to it become Weak." },
  { id: "wildfire", name: "Wildfire", recipe: "Fire + Nature", text: "The tangled vines catch fire - the Burn spreads to every unit next to the target." },
  { id: "rot", name: "Rot", recipe: "Poison + Nature", text: `The poison rots the vines into the flesh - the target loses ${ROT_MAX_HP} max HP for the fight.` },
  { id: "freeze", name: "Freeze", recipe: `Frost x${FREEZE_AT}`, text: "Two Chill freezes a unit solid - it skips its next turn." },
  { id: "shatter", name: "Shatter", recipe: "Hit a Frozen unit", text: "The next hit on a Frozen unit deals +50% and thaws it - strike now, or let it lose its turn." },
]

// What each element status combos with (token tooltips).
export const ELEMENT_TIPS = {
  burn: "Fire - combos: +Poison = Toxic Blaze, +Frost = Steam, +Nature = Wildfire",
  chill: `Frost - ${FREEZE_AT} Chill = Frozen; +Fire = Steam`,
  frozen: "Frozen - skips its next turn; the next hit deals +50% (Shatter) and thaws it",
  entangle: "Nature - combos: +Fire = Wildfire, +Poison = Rot. Fades after 2 turns",
  poison: "Poison - combos: +Fire = Toxic Blaze, +Nature = Rot",
}

// --- Sources: which abilities carry an element (data only) ---------------
// [element, amount]. Poison-strike already adds its poison itself (amount 0
// = only check combos). className wins, then unit id, then ability kind.
const CLASS_ELEMENTS = {
  Frostbinder: ["frost", 1],
  Frostblade: ["frost", 1],
  Diviner: ["fire", 2],
  Sweeper: ["nature", 2],
  Briarblade: ["nature", 2],
}
const UNIT_ELEMENTS = {
  cinderpaw: ["fire", 1],
  ashmaw: ["fire", 1],
  "ember-elemental": ["fire", 2],
  emberbanner: ["fire", 2],
  emberwisp: ["fire", 2],
  emberzeal: ["fire", 2],
}
const KIND_ELEMENTS = {
  "poison-strike": ["poison", 0],
  "root-shot": ["nature", ENTANGLE_DURATION],
}
const DAMAGING_KINDS = new Set(["poison-strike", "root-shot", "burst", "dash", "cleave", "push"])

export function abilityElement(unit) {
  const ability = unit?.ability
  if (!ability || !DAMAGING_KINDS.has(ability.kind)) return null
  const tag = CLASS_ELEMENTS[unit.className] || UNIT_ELEMENTS[unit.defId] || KIND_ELEMENTS[ability.kind]
  return tag ? { element: tag[0], amount: tag[1] } : null
}

export function describeAbilityElement(unit) {
  const tag = abilityElement(unit)
  if (!tag) return ""
  const e = ELEMENTS[tag.element]
  if (tag.element === "poison") return `${e.icon} Poison element - combos with Fire and Nature.`
  const what = tag.element === "frost" ? `${tag.amount} Chill` : tag.element === "nature" ? "Entangle" : `${tag.amount} Burn`
  return `${e.icon} ${e.name}: also adds ${what} to the target.`
}

// --- Core ------------------------------------------------------------------
const addLog = (state, line) => (state.log ? { ...state, log: [...state.log, line] } : state)

function comboEvent(state, unitId, combo, label, tiles, big) {
  return emit(state, { kind: "combo", unitId, combo, label, tiles, big })
}

function neighbours(state, unit) {
  return livingUnits(state, unit.side).filter((u) => u.id !== unit.id && kingAdjacent(u.pos, unit.pos))
}

// Which combo landing `element` on `u` would fire (null = none).
export function comboFor(u, element) {
  if (!u || !element) return null
  const burning = u.burn > 0
  const chilled = u.chill > 0 || u.frozen > 0
  const poisoned = u.poison > 0
  const tangled = u.entangle > 0
  if (element === "fire") {
    if (poisoned) return "toxic-blaze"
    if (chilled) return "steam"
    if (tangled) return "wildfire"
  } else if (element === "frost") {
    if (burning) return "steam"
    if ((u.chill || 0) + 1 >= FREEZE_AT && !(u.frozen > 0)) return "freeze"
  } else if (element === "poison") {
    if (burning) return "toxic-blaze"
    if (tangled) return "rot"
  } else if (element === "nature") {
    if (burning) return "wildfire"
    if (poisoned) return "rot"
  }
  return null
}

// Enemy AI: extra score for a hex whose status would set off a combo.
export function comboScoreForStatus(target, status) {
  const combo = comboFor(target, STATUS_TO_ELEMENT[status])
  if (!combo) return 0
  return combo === "toxic-blaze" || combo === "freeze" ? 45 : 30
}

// Put `amount` of an element on a unit, then resolve combos.
export function applyElement(state, unitId, element, amount) {
  const u = getUnit(state, unitId)
  if (!u || u.hp <= 0 || !ELEMENTS[element]) return state
  const combo = comboFor(u, element)
  // Frost onto a burning unit / partner already there: the combo consumes
  // instead of stacking (freeze still needs the chill counted).
  if (combo && combo !== "freeze") return resolveCombo(state, unitId, combo, element, amount)
  const status = ELEMENTS[element].status
  const patch = element === "nature" ? { entangle: Math.max(u.entangle || 0, amount || ENTANGLE_DURATION) } : { [status]: (u[status] || 0) + (amount || 0) }
  let next = setUnit(state, unitId, patch)
  if (combo === "freeze") next = resolveCombo(next, unitId, "freeze", element, amount)
  return next
}

// The status was already put on the unit by existing code (poison-strike,
// relic burn, hex): just check whether it set off a combo.
export function reactElement(state, unitId, element) {
  const u = getUnit(state, unitId)
  if (!u || u.hp <= 0 || !state.log) return state
  // Test the combo against the unit WITHOUT the just-added element's
  // own counter (so burn+burn never "combos" with itself).
  const status = ELEMENTS[element]?.status
  if (!status) return state
  const without = { ...u, [status]: element === "frost" ? Math.max(0, (u.chill || 0) - 1) : 0 }
  const combo = comboFor(without, element)
  if (!combo) return state
  return resolveCombo(state, unitId, combo, element, 0)
}

export function reactStatus(state, unitId, status) {
  const element = STATUS_TO_ELEMENT[status]
  if (!element) return state
  if (status === "root") return applyElement(state, unitId, "nature", ENTANGLE_DURATION)
  return reactElement(state, unitId, element)
}

function resolveCombo(state, unitId, combo, element, amount) {
  const u = getUnit(state, unitId)
  let next = state
  if (combo === "freeze") {
    next = setUnit(next, unitId, { chill: 0, frozen: 1 })
    next = comboEvent(next, unitId, combo, "Frozen!", [u.pos], false)
    return addLog(next, `❄ Freeze! ${u.name} is frozen solid - it skips its next turn, and the next hit on it Shatters (+50%).`)
  }
  if (combo === "steam") {
    const hit = [u, ...neighbours(next, u)]
    next = setUnit(next, unitId, { burn: 0, chill: 0, frozen: 0 })
    for (const v of hit) next = setUnit(next, v.id, { weak: (getUnit(next, v.id).weak || 0) + 1 })
    next = comboEvent(next, unitId, combo, "Steam!", hit.map((v) => v.pos), false)
    return addLog(next, `♨ Steam! Fire meets frost on ${u.name} - ${hit.map((v) => v.name).join(", ")} ${hit.length > 1 ? "are" : "is"} Weakened.`)
  }
  if (combo === "wildfire") {
    const fuel = Math.max(2, (u.burn || 0) + (element === "fire" ? amount || 0 : 0))
    const spread = neighbours(next, u)
    next = setUnit(next, unitId, { entangle: 0, burn: fuel })
    for (const v of spread) next = setUnit(next, v.id, { burn: (getUnit(next, v.id).burn || 0) + fuel })
    next = comboEvent(next, unitId, combo, "Wildfire!", [u.pos, ...spread.map((v) => v.pos)], true)
    return addLog(next, `🔥 Wildfire! The vines around ${u.name} catch - Burn ${fuel} spreads to ${spread.length ? spread.map((v) => v.name).join(", ") : "nothing nearby"}.`)
  }
  if (combo === "rot") {
    const maxHp = Math.max(1, u.maxHp - ROT_MAX_HP)
    next = setUnit(next, unitId, { entangle: 0, maxHp, hp: Math.min(u.hp, maxHp) })
    next = comboEvent(next, unitId, combo, "Rot!", [u.pos], false)
    return addLog(next, `🍂 Rot! Poison seeps through the vines - ${u.name} loses ${u.maxHp - maxHp} max HP.`)
  }
  // Toxic Blaze
  const burn = (u.burn || 0) + (element === "fire" ? amount || 0 : 0)
  const poison = (u.poison || 0) + (element === "poison" ? amount || 0 : 0)
  const blast = Math.max(3, burn + poison)
  const splash = Math.ceil(blast / 2)
  const around = neighbours(next, u)
  next = setUnit(next, unitId, { burn: 0, poison: 0 })
  next = comboEvent(next, unitId, "toxic-blaze", "Toxic Blaze!", [u.pos, ...around.map((v) => v.pos)], true)
  const parts = []
  for (const [v, dmg] of [[u, blast], ...around.map((v) => [v, splash])]) {
    if (next.phase === "won" || next.phase === "lost") break
    if (!(getUnit(next, v.id)?.hp > 0)) continue
    const hit = applyDamageWithBlock(next, v.id, dmg)
    next = checkEnemyPhase(hit.next, v.id)
    if (hit.fell) next = trySpawnBrood(next, v.id)
    parts.push(`${v.name} ${hit.remaining}${hit.fell ? " (falls)" : ""}`)
  }
  next = addLog(next, `☣ Toxic Blaze! Burn and poison ignite on ${u.name}: ${parts.join(", ")}.`)
  return checkTacticsBattleEnd(next)
}

// --- Hooks the engine calls -------------------------------------------------
// modifiedAttackAmount: a Frozen defender takes +50%.
export function frozenBonus(defender, amount) {
  return defender.frozen > 0 ? Math.floor(amount * SHATTER_MULT) : amount
}

// applyDamageWithBlock: a real hit on a Frozen unit thaws it (Shatter).
export function shatterOnHit(state, targetId, amount) {
  const t = getUnit(state, targetId)
  if (!(amount > 0) || !(t?.frozen > 0)) return state
  const next = comboEvent(setUnit(state, targetId, { frozen: 0 }), targetId, "shatter", "Shatter!", [t.pos], true)
  return addLog(next, `💥 Shatter! ${t.name}'s frozen shell cracks (+50% damage) - it thaws.`)
}

// Enemy turn loop: a Frozen enemy loses its action (like Stun).
export function spendFrozen(state, unitId) {
  const u = getUnit(state, unitId)
  if (!u || !(u.frozen > 0)) return null
  const next = emit(setUnit(state, unitId, { frozen: 0 }), { kind: "reaction", unitId, label: "Frozen!" })
  return addLog(next, `${u.name} is frozen solid and loses its turn.`)
}

// Start of `side`'s own turn: Entangle fades; a Frozen player unit loses
// its turn (0 AP) and thaws.
export function elementTurnStart(state, side) {
  let next = state
  for (const u of livingUnits(state, side)) {
    if (u.entangle > 0) next = setUnit(next, u.id, { entangle: u.entangle - 1 })
    if (side === "player" && u.frozen > 0) {
      next = emit(setUnit(next, u.id, { frozen: 0, ap: 0 }), { kind: "reaction", unitId: u.id, label: "Frozen!" })
      next = addLog(next, `${u.name} is frozen solid and loses this turn.`)
    }
  }
  return next
}

// castAbility: the actor's element lands on the ability's target.
export function afterAbilityCast(state, actorId, targetId) {
  const actor = getUnit(state, actorId)
  const tag = abilityElement(actor)
  const target = targetId ? getUnit(state, targetId) : null
  if (!tag || !target || target.hp <= 0 || target.side === actor.side) return state
  if (state.phase === "won" || state.phase === "lost") return state
  if (tag.amount === 0) return reactElement(state, targetId, tag.element)
  return applyElement(state, targetId, tag.element, tag.amount)
}
