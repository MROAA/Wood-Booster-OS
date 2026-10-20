import { gatherHerb } from "./herbalism.js"

// End of turn: every unit standing on a herb patch gathers one herb from it.
export function endTurn(state) {
  let next = state
  for (const unit of Object.values(state.units)) {
    const patch = state.patches[unit.tile]
    if (patch) next = gatherHerb(next, unit.id, patch)
  }
  return { ...next, turn: next.turn + 1 }
}
