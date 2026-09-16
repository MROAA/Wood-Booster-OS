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
import { streamRng } from "../../data/heartwood/seed"
import { GRID } from "./tacticsEngine"

// Only these two phases mean "the player is standing in front of, or
// mid-way through, a real fight" - every other phase (shop/relic/event/
// choice/victory/defeat) has no "current enemy" worth previewing.
const PREVIEWABLE_PHASES = new Set(["formation", "battle"])

// Seeded terrain round: how many scattered hazard/terrain cells a real
// fight gets, and their weighted type mix - the real 4 ids already
// defined in tacticsEngine.js's own TERRAIN map, no new type invented.
// rock/water/poison are the real hazards ("hazardit"); forest is a
// zero-cost cosmetic variant ("ja muut" - Marc's own "and other
// things") so a fight can look different even when nothing dangerous
// lands nearby.
const TERRAIN_HAZARD_COUNT = 6
function pickTerrainType(roll) {
  if (roll < 0.3) return "rock"
  if (roll < 0.5) return "water"
  if (roll < 0.75) return "poison"
  return "forest"
}

// Seed System PRD (seed.js's own SEED_STREAMS): "combat" was reserved
// from PR #429 onward but never wired - this is its first real use, not
// a new stream invented. streamRng(seed, "combat", `${nodeIndex}:terrain`)
// is a fresh, stable generator - the SAME (seed, nodeIndex) always
// regenerates the SAME battlefield (reload-safe, share-a-seed-safe),
// matching every other stream-consuming caller's own contract exactly.
// Confined to the grid's middle columns, keeping a 3-column buffer clear
// on each side (never touching a spawn column) regardless of GRID.cols -
// the same "hazards live between the two sides" shape The Crossing's own
// hand-authored layout already established, generalized so a future
// board-size change needs no edit here either. A pure function of
// (seed, nodeIndex) -
// tacticsEngine.js itself stays unaware the seed system exists at all;
// it just receives a plain terrain map, indistinguishable from a
// hand-authored ENEMY_FORMATIONS one.
export function generateRealTerrain(seed, nodeIndex) {
  const rng = streamRng(seed, "combat", `${nodeIndex}:terrain`)
  const terrain = {}
  let placed = 0
  let attempts = 0
  while (placed < TERRAIN_HAZARD_COUNT && attempts < TERRAIN_HAZARD_COUNT * 4) {
    attempts++
    const row = Math.floor(rng() * GRID.rows)
    const col = 3 + Math.floor(rng() * (GRID.cols - 6))
    const key = `${row}-${col}`
    if (terrain[key]) continue
    terrain[key] = pickTerrainType(rng())
    placed++
  }
  return terrain
}

// Resolves an already-in-memory runState + node into { label, squadDefIds,
// enemyDefIds, characterId, commanderRank, terrain } for the tactics
// engine's createRealMatchupBattle, or null when there's nothing resolvable (no
// encounter id, or an empty squad/enemy side). Pure - no localStorage
// touch at all, so HeartwoodBattle.jsx can call this directly on the
// LIVE runState it already has in React state, no round-trip needed.
// Phase-gating (is the player even standing in front of a fight right
// now) is the CALLER's job - loadRealMatchup below does it for the
// localStorage-reading path; HeartwoodBattle.jsx already only calls this
// from its own formation/battle-phase code paths.
export function resolveRealMatchup(runState, node) {
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
    // Real-fight wiring round: the run's own actual chosen Commander +
    // Rank-Up level, threaded through to createRealMatchupBattle so it
    // can deploy the SAME Commander (with the same real rank-scaled
    // Squad Passive) the player actually has, not a hardcoded default.
    characterId: runState.characterId,
    commanderRank: runState.commanderRank || 0,
    // Seeded terrain round: a battlefield generated from the run's own
    // seed + this node's own stable index - the same seed always
    // regenerates the same terrain for the same fight.
    terrain: generateRealTerrain(runState.seed, runState.nodeIndex),
  }
}

// Reads the real run's save (localStorage) and resolves it via
// resolveRealMatchup above, or null when there's nothing previewable (no
// save, wrong phase, an unresolvable encounter, or an empty squad/enemy
// side). Never throws. Used by the standalone /heartwood-tactics page,
// which has no runState of its own to read directly.
export function loadRealMatchup() {
  const runState = deserializeRun(loadRunSave())
  if (!runState || !PREVIEWABLE_PHASES.has(runState.phase)) return null
  return resolveRealMatchup(runState, runState.path?.[runState.nodeIndex])
}
