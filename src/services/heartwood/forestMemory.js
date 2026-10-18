// Hearthwood - New Game+: what the forest remembers between runs.
// Purpose: record the truths / endings / regard of a finished run into the
// meta store, and bring them into the next run. Pure - the page saves meta.
// Data + numbers: data/heartwood/forestMemory.js.
import { LORE_FLAGS, RETURNING_FLAG, NEW_VERSE, REGARD_CARRY, RUNE_PER_CYCLE, RUNE_CYCLE_MAX, truthText } from "../../data/heartwood/forestMemory"
import { RUNE_IDS, RUNE_POUCH_MAX } from "../../data/heartwood/runes"
import { streamRng } from "../../data/heartwood/seed"

export function freshForestMemory() {
  return { cycle: 0, lore: [], endings: [], lastRegard: 0 }
}

export function sanitizeForestMemory(m) {
  const base = freshForestMemory()
  if (!m || typeof m !== "object") return base
  return {
    cycle: Number.isInteger(m.cycle) && m.cycle > 0 ? m.cycle : 0,
    lore: Array.isArray(m.lore) ? m.lore.filter((f) => LORE_FLAGS.includes(f)) : [],
    endings: Array.isArray(m.endings) ? m.endings.filter((e) => typeof e === "string") : [],
    lastRegard: Number.isFinite(m.lastRegard) ? m.lastRegard : 0,
  }
}

// A finished run (won or lost): truths learned always stay; a win also
// counts a cycle and the ending you chose.
export function recordForestMemory(memory, runState, won) {
  const m = sanitizeForestMemory(memory)
  const learned = LORE_FLAGS.filter((f) => runState?.storyFlags?.[f])
  const ending = won ? runState?.chosenEnding : null
  return {
    cycle: m.cycle + (won ? 1 : 0),
    lore: [...new Set([...m.lore, ...learned])],
    endings: ending && !m.endings.includes(ending) ? [...m.endings, ending] : m.endings,
    lastRegard: Number(runState?.regard) || 0,
  }
}

// A new run, shaped by what the forest remembers.
export function withForestMemory(runState, memory) {
  const m = sanitizeForestMemory(memory)
  if (!m.cycle && !m.lore.length) return { ...runState, cycle: 0, rememberedLore: [] }
  const carried = Math.max(-REGARD_CARRY.cap, Math.min(REGARD_CARRY.cap, Math.round(m.lastRegard * REGARD_CARRY.share)))
  let runes = Array.isArray(runState.runes) ? runState.runes : []
  const extra = Math.min(RUNE_CYCLE_MAX, m.cycle * RUNE_PER_CYCLE)
  const rng = streamRng(runState.seed ?? 0, "rune", "cycle")
  for (let i = 0; i < extra && runes.length < RUNE_POUCH_MAX; i++) {
    const fresh = RUNE_IDS.filter((id) => !runes.includes(id))
    const pool = fresh.length ? fresh : RUNE_IDS
    runes = [...runes, pool[Math.floor(rng() * pool.length) % pool.length]]
  }
  return {
    ...runState,
    cycle: m.cycle,
    rememberedLore: m.lore,
    seenEndings: m.endings,
    regard: (Number(runState.regard) || 0) + (m.cycle ? carried : 0),
    runes,
  }
}

export function cycleOf(runState) {
  return Number(runState?.cycle) || 0
}

// Story gates: remembered truths count as known; a returning traveller
// carries the RETURNING_FLAG for places only they can find.
export function gateFlags(runState) {
  const flags = { ...(runState?.storyFlags || {}) }
  for (const f of runState?.rememberedLore || []) flags[f] = true
  if (cycleOf(runState) >= 1) flags[RETURNING_FLAG] = true
  return flags
}

export function knownTruths(runState) {
  const now = LORE_FLAGS.filter((f) => runState?.storyFlags?.[f])
  return [...new Set([...(runState?.rememberedLore || []), ...now])]
}

export function newVerseStatus(runState) {
  const known = knownTruths(runState).length
  const returning = cycleOf(runState) >= NEW_VERSE.minCycle
  return { open: returning && known >= NEW_VERSE.truthsNeeded, returning, known, needed: NEW_VERSE.truthsNeeded }
}

export function rememberedTexts(runState) {
  return (runState?.rememberedLore || []).map(truthText)
}
