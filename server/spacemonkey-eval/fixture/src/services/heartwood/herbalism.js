import { herbDef } from "../../data/heartwood/herbs.js"

function withUnit(state, unitId, patch) {
  return { ...state, units: { ...state.units, [unitId]: { ...state.units[unitId], ...patch } } }
}

// Gathering adds one herb to the unit's satchel, respecting the herb's stack limit.
export function gatherHerb(state, unitId, herbId) {
  const def = herbDef(herbId)
  if (!def) return state
  const unit = state.units[unitId]
  const count = unit.satchel[herbId] || 0
  if (count > def.stackMax) return state
  return withUnit(state, unitId, { satchel: { ...unit.satchel, [herbId]: count + 1 } })
}

// Brewing consumes one herb and heals the brewer by the herb's heal value, capped at max HP.
export function brewPotion(state, unitId, herbId) {
  const def = herbDef(herbId)
  const unit = state.units[unitId]
  const count = unit.satchel[herbId] || 0
  if (!def || count < 1) return state
  const hp = Math.min(unit.hpMax, unit.hp + def.heal)
  return withUnit(state, unitId, { hp, satchel: { ...unit.satchel, [herbId]: count - 1 } })
}
