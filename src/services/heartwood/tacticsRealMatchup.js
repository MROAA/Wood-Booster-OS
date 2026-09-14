// Hearthwood Frontier - Phase 4's "real preview" bridge. The ONLY file
// that reads a real run's save; kept separate from tacticsEngine.js so the
// core engine's own "no import from runEngine.js/autoBattleEngine.js/
// effects.js, no localStorage" isolation (unbroken since Phase 1) stays
// intact.
//
// Every read here is provably non-mutating: loadRunSave (runSaveState.js)
// is a plain localStorage.getItem + JSON.parse, try/catch, already used
// exactly this way in production; deserializeRun (runEngine.js) is pure
// shape/version validation, also already production-used with zero side
// effects, and already returns null defensively on any corrupt/missing/
// old-version save rather than throwing; resolveFormation (formations.js)
// is the SAME function FormationScreen.jsx already calls to resolve a
// node's real formationId/enemyId - including its built-in fallback that
// wraps a bare solo-enemy id into a 1-piece formation, so any real
// encounter (a multi-piece formation OR a single enemy) resolves through
// one call. This module never imports saveRunSave or anything else that
// could write - there is no path from here back into the real run.
import { loadRunSave } from "./runSaveState"
import { deserializeRun } from "./runEngine"
import { resolveFormation } from "../../data/heartwood/formations"
import { ENEMIES } from "../../data/heartwood/enemies"
import { UNITS } from "../../data/heartwood/units"

// Only these two phases mean "the player is standing in front of, or
// mid-way through, a real fight" - every other phase (shop/relic/event/
// choice/victory/defeat) has no "current enemy" worth previewing.
const PREVIEWABLE_PHASES = new Set(["formation", "battle"])

// Reads the real run's save and resolves it into { label, squadDefIds,
// enemyDefIds } for the tactics engine's createRealMatchupBattle, or null
// when there's nothing previewable (no save, wrong phase, an unresolvable
// encounter, or an empty squad/enemy side). Never throws.
export function loadRealMatchup() {
  const runState = deserializeRun(loadRunSave())
  if (!runState || !PREVIEWABLE_PHASES.has(runState.phase)) return null

  const node = runState.path?.[runState.nodeIndex]
  const encounterId = node?.formationId || node?.enemyId
  if (!encounterId) return null

  const formation = resolveFormation(encounterId)
  const enemyDefIds = formation.pieces.map((p) => p.defId).filter((id) => ENEMIES[id])

  const squadDefIds = (runState.deployed || [])
    .filter((key) => key !== null)
    .map((key) => (runState.bench || []).find((e) => e.key === key))
    .filter((entry) => entry && UNITS[entry.defId])
    .map((entry) => entry.defId)

  if (!enemyDefIds.length || !squadDefIds.length) return null

  return {
    label: formation.name || ENEMIES[enemyDefIds[0]]?.name || "your run's next fight",
    squadDefIds,
    enemyDefIds,
  }
}
