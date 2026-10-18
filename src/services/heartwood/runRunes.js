// Hearthwood - the Rune Pouch: how a run finds, keeps and carves runes.
// Purpose: the run-side rules of the rune system (First Song PRD §4).
//   - a run starts with one rune (startingRunes)
//   - elites and minibosses drop one (runeDrop); a full pouch leaves it
//   - on the Formation screen you mark one rune to carve (carveRune /
//     uncarveRune); startTacticsFormationBattle spends it (spendCarvedRune)
// The fight side lives in tacticsRunes.js, the data in data/heartwood/runes.js.
// Pure; randomness only from the run seed (its own "rune" stream, so no
// other system's rolls shift).
import { RUNES, RUNE_IDS, RUNE_POUCH_MAX } from "../../data/heartwood/runes"
import { streamRng } from "../../data/heartwood/seed"

const pick = (rng, list) => (list.length ? list[Math.floor(rng() * list.length) % list.length] : null)

export function runePouch(runState) {
  return Array.isArray(runState?.runes) ? runState.runes.filter((id) => RUNES[id]) : []
}

export function startingRunes(seed) {
  return [pick(streamRng(seed, "rune", "start"), RUNE_IDS)]
}

// Elite / miniboss win: one rune, preferring one you don't already hold.
export function runeDrop(runState, node) {
  if (!node || (node.type !== "elite" && node.type !== "miniboss")) return runState
  const pouch = runePouch(runState)
  const rng = streamRng(runState.seed, "rune", `${runState.nodeIndex}:drop`)
  const fresh = RUNE_IDS.filter((id) => !pouch.includes(id))
  const id = pick(rng, fresh.length ? fresh : RUNE_IDS)
  const rune = RUNES[id]
  if (!rune) return runState
  if (pouch.length >= RUNE_POUCH_MAX) {
    return { ...runState, lastAftermath: [...(runState.lastAftermath || []), `${rune.glyph} A ${rune.name} rune glows in the moss - but your Rune Pouch is full (${RUNE_POUCH_MAX}). Carve one to make room.`] }
  }
  return {
    ...runState,
    runes: [...pouch, id],
    lastRuneFound: id,
    lastAftermath: [...(runState.lastAftermath || []), `${rune.glyph} Rune found: ${rune.name}. ${rune.meaning} Carve it before a fight.`],
  }
}

export function carveRune(runState, id) {
  if (!runePouch(runState).includes(id)) return runState
  return { ...runState, carvedRune: runState.carvedRune === id ? null : id }
}

export function uncarveRune(runState) {
  return runState?.carvedRune ? { ...runState, carvedRune: null } : runState
}

// The rune marked for this fight, if it is really in the pouch.
export function carvedRuneId(runState) {
  const id = runState?.carvedRune
  return id && runePouch(runState).includes(id) ? id : null
}

// Takes the carved rune out of the pouch (one copy) once its fight starts.
export function spendCarvedRune(runState) {
  const id = carvedRuneId(runState)
  if (!id) return runState?.carvedRune ? { ...runState, carvedRune: null } : runState
  const pouch = runePouch(runState)
  const at = pouch.indexOf(id)
  return { ...runState, runes: [...pouch.slice(0, at), ...pouch.slice(at + 1)], carvedRune: null, runesCarved: (runState.runesCarved || 0) + 1 }
}
