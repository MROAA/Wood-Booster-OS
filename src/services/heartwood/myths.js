// Hearthwood - the Four Tellings, run side: gather the evidence a run has,
// hold the player's belief, and shape the ending by it. Pure.
// Data + text: data/heartwood/myths.js.
import { TELLINGS, TELLING_ORDER, EVIDENCE, BELIEF_BORNE_OUT } from "../../data/heartwood/myths"

// Every telling with the evidence this run has found for it.
export function tellingsWithEvidence(runState) {
  const flags = runState?.storyFlags || {}
  return TELLING_ORDER.map((id) => ({
    ...TELLINGS[id],
    evidence: Object.entries(EVIDENCE)
      .filter(([flag, ev]) => ev.telling === id && flags[flag])
      .map(([, ev]) => ev.text),
  }))
}

export function evidenceFor(runState, tellingId) {
  return tellingsWithEvidence(runState).find((t) => t.id === tellingId)?.evidence.length || 0
}

export function beliefOf(runState) {
  const id = runState?.belief
  return id && TELLINGS[id] ? TELLINGS[id] : null
}

// Choosing what you believe needs at least one piece of evidence for it.
// Choosing the same telling again lets the belief go.
export function believe(runState, tellingId) {
  if (!TELLINGS[tellingId]) return runState
  if (runState.belief === tellingId) return { ...runState, belief: null }
  if (evidenceFor(runState, tellingId) < 1) return runState
  return { ...runState, belief: tellingId }
}

// The Forest's Choice: which path your belief points at, and whether the
// evidence bears it out.
export function beliefForEnding(runState, endingId) {
  const b = beliefOf(runState)
  if (!b || b.endingId !== endingId) return null
  return { ...b, borneOut: evidenceFor(runState, b.id) >= BELIEF_BORNE_OUT }
}

// The ending cinematic, with your belief's last word: the telling's own
// coda when you chose its ending AND the evidence bears it out; a quieter
// line when you chose another way, or believed on too little.
export function cinematicWithBelief(cinematic, runState) {
  const b = beliefOf(runState)
  if (!cinematic || !b || !/^ending-/.test(cinematic.id)) return cinematic
  const borne = evidenceFor(runState, b.id) >= BELIEF_BORNE_OUT
  let line
  if (b.endingId === cinematic.id && borne) line = { speaker: "The forest", tone: "gentle", line: b.coda, belief: b.id }
  else if (b.endingId === cinematic.id) line = { speaker: "The forest", tone: "quiet", line: `You believed ${b.name.replace(/^The /, "the ")} on very little. It may have been right anyway.`, belief: b.id }
  else line = { speaker: "The forest", tone: "quiet", line: `You believed ${b.name.replace(/^The /, "the ")} - and still chose another way. Maybe that is how every telling begins.`, belief: b.id }
  return { ...cinematic, lines: [...cinematic.lines, line] }
}
