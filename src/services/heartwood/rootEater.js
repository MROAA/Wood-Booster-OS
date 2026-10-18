// Hearthwood - the Root-Eater, run side (First Song PRD §6: "huge creatures
// that feed on dead roots and old magical bonds; their movement changes
// whole areas"). Data: ROOT_EATER in data/heartwood/creatures.js; the fight
// side (surfacing, eating the board) lives in tacticsCreatures.js.
//
// runState.rootEater: null (not yet rolled) | { state, distance, passes }
//   state: "slept" (never woke this run) | "approaching" | "gone"
// Pure; the one roll uses the run seed's own "creature" stream.
import { ROOT_EATER } from "../../data/heartwood/creatures"
import { runModifierById } from "../../data/heartwood/boons"
import { streamRng } from "../../data/heartwood/seed"

const line = (rs, text) => ({ ...rs, lastAftermath: [...(rs.lastAftermath || []), text] })

export function rootEaterOf(runState) {
  return runState?.rootEater || null
}

// From Act III, once per run: does a Root-Eater wake and come for you?
export function wakeRootEater(runState, act) {
  if (!runState || runState.rootEater || act < ROOT_EATER.fromAct) return runState
  const rng = streamRng(runState.seed ?? 0, "creature", "root-eater")
  if (rng() >= ROOT_EATER.chance) return { ...runState, rootEater: { state: "slept", distance: 0, passes: 0 } }
  return line(
    { ...runState, rootEater: { state: "approaching", distance: ROOT_EATER.approach, passes: 0 } },
    `🪱 Something huge is moving under the roots. A ${ROOT_EATER.name} has woken - and it is coming your way (${ROOT_EATER.approach} fights).`,
  )
}

export function rootEaterArrivesNow(runState) {
  const r = rootEaterOf(runState)
  return !!r && r.state === "approaching" && r.distance <= 0
}

// After a won fight: it creeps a fight closer, or - if it surfaced in this
// fight - it sinks again (and after its last pass, for good).
export function tickRootEater(runState, battle) {
  const r = rootEaterOf(runState)
  if (!r || r.state !== "approaching") return runState
  if (battle?.rootEaterArrived) {
    const passes = r.passes + 1
    if (passes >= ROOT_EATER.passes) return line({ ...runState, rootEater: { ...r, state: "gone", distance: 0, passes } }, `🪱 The ${ROOT_EATER.name} sinks into the deep roots and does not come back.`)
    return line({ ...runState, rootEater: { ...r, distance: ROOT_EATER.again, passes } }, `🪱 The ${ROOT_EATER.name} sinks back into the roots. It will surface again (${ROOT_EATER.again} fights).`)
  }
  return { ...runState, rootEater: { ...r, distance: Math.max(0, r.distance - 1) } }
}

// It feeds on old bonds: your oldest bane if the forest regards you well,
// otherwise your newest boon. Returns { runState, eaten } (eaten = id | null).
export function devourBond(runState) {
  const held = runState?.runModifiers || []
  const kindOf = (id) => runModifierById(id)?.kind
  const kind = (Number(runState?.regard) || 0) >= 0 ? "bane" : "boon"
  const pool = held.filter((id) => kindOf(id) === kind)
  const eaten = kind === "bane" ? pool[0] : pool[pool.length - 1]
  if (!eaten) return { runState, eaten: null }
  const name = runModifierById(eaten)?.name || eaten
  const text =
    kind === "bane"
      ? `🪱 The ${ROOT_EATER.name} feeds on an old bond: your ${name} is eaten away. The forest looked after you.`
      : `🪱 The ${ROOT_EATER.name} feeds on an old bond: your ${name} is eaten away. The forest did not stop it.`
  return { runState: line({ ...runState, runModifiers: held.filter((id) => id !== eaten), rootEaterAte: eaten }, text), eaten }
}
