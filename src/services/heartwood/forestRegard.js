// Hearthwood - Forest Regard: how the forest sees you (First Song PRD §6).
// Purpose: the run-side bookkeeping the forest's creatures react to. Pure.
// Numbers + bands: data/heartwood/creatures.js.
import { REGARD, REGARD_MIN, REGARD_MAX, regardBand } from "../../data/heartwood/creatures"

const clamp = (n) => Math.max(REGARD_MIN, Math.min(REGARD_MAX, Math.round(n)))

export function regardOf(runState) {
  return Number(runState?.regard) || 0
}

// Adds `delta`, and an aftermath line naming why when the band changes.
export function adjustRegard(runState, delta, why = null) {
  if (!runState || !delta) return runState
  const before = regardOf(runState)
  const after = clamp(before + delta)
  if (after === before) return runState
  const b0 = regardBand(before)
  const b1 = regardBand(after)
  const line = b0.id !== b1.id ? `🌲 The forest's regard shifts: ${b1.name}. ${b1.text}` : null
  return {
    ...runState,
    regard: after,
    regardLog: [...(runState.regardLog || []), { delta, why, at: runState.nodeIndex ?? 0 }].slice(-12),
    lastAftermath: line ? [...(runState.lastAftermath || []), line] : runState.lastAftermath,
  }
}

// Living trees on the board (a hidden Shapeshifter is not a tree).
export function countTrees(battle) {
  if (!battle?.terrain) return 0
  const mimics = battle.mimics || {}
  return Object.entries(battle.terrain).filter(([key, t]) => t === "tree" && !mimics[key]).length
}

// After a fight: a clean fight pleases the forest, fallen trees anger it.
export function regardAfterFight(runState, battle) {
  if (!battle || battle.treesAtStart == null) return runState
  const lost = Math.max(0, battle.treesAtStart - countTrees(battle))
  if (lost === 0) return adjustRegard(runState, REGARD.cleanFight, "No tree fell in your fight")
  const delta = Math.max(REGARD.maxTreeLoss, REGARD.perTreeLost * lost)
  return adjustRegard(runState, delta, `${lost} tree${lost > 1 ? "s" : ""} fell in your fight`)
}
