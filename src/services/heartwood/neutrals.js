// Hearthwood - DOTA DEPTH 2: NEUTRAL ITEMS, the run side (pure).
// Purpose: drops after won fights, the stash, and each hero's ONE neutral
// slot (apart from the gear row). Data: data/heartwood/neutrals.js; the
// effects in a fight: tacticsTalents.applyNeutralToUnit.
// Stored on the run (and the Long Campaign): `neutralStash` (neutral ids
// not worn), bench entry `neutral` (the worn one), `commanderNeutral`,
// `lastNeutralDrop` ({ id, tier } - the drop banner until dismissed).
// Public API: neutralTierForAct, rollNeutralDrop, neutralDrop,
// equipNeutral, unequipNeutral, ownedNeutralIds, clearNeutralDrop.
import { streamRng } from "../../data/heartwood/seed"
import { NEUTRAL_ITEMS, NEUTRAL_TIERS, NEUTRAL_DROP_CHANCE, neutralsOfTier } from "../../data/heartwood/neutrals"

const arr = (v) => (Array.isArray(v) ? v : [])

// The highest tier that can drop in this Act.
export function neutralTierForAct(act = 1) {
  let tier = 1
  for (const t of Object.values(NEUTRAL_TIERS)) if (t.act <= act && t.tier > tier) tier = t.tier
  return tier
}

// Every neutral the run owns (stash + worn).
export function ownedNeutralIds(runState) {
  const out = [...arr(runState?.neutralStash)]
  for (const e of arr(runState?.bench)) if (e.neutral) out.push(e.neutral)
  if (runState?.commanderNeutral) out.push(runState.commanderNeutral)
  return out
}

// The neutral a won fight at `node` drops, or null. Deterministic (seed +
// node index): the top open tier most of the time, sometimes one below.
export function rollNeutralDrop(runState, node, act = 1) {
  const chance = NEUTRAL_DROP_CHANCE[node?.type] || 0
  if (!chance || !runState) return null
  const rng = streamRng(runState.seed || 0, "loot", `${runState.nodeIndex || 0}:neutral`)
  if (rng() >= chance) return null
  const top = neutralTierForAct(act)
  const tier = top > 1 && rng() < 0.35 ? top - 1 : top
  const owned = new Set(ownedNeutralIds(runState))
  let pool = neutralsOfTier(tier).filter((n) => !owned.has(n.id))
  if (!pool.length) pool = neutralsOfTier(tier)
  return pool[Math.floor(rng() * pool.length)]?.id || null
}

// After a won fight: the drop (if any) goes to the stash + the banner.
export function neutralDrop(runState, node, act = 1) {
  const id = rollNeutralDrop(runState, node, act)
  if (!id) return runState
  const n = NEUTRAL_ITEMS[id]
  return {
    ...runState,
    neutralStash: [...arr(runState.neutralStash), id],
    lastNeutralDrop: { id, tier: n.tier },
    lastAftermath: [...arr(runState.lastAftermath), `Neutral drop: ${n.name} (${NEUTRAL_TIERS[n.tier].name})! Give it to a hero's neutral slot.`],
  }
}

export function clearNeutralDrop(runState) {
  return runState?.lastNeutralDrop ? { ...runState, lastNeutralDrop: null } : runState
}

// Put a stashed neutral in a hero's slot (`key` = bench key or
// "commander"); whatever it wore goes back to the stash.
export function equipNeutral(runState, key, neutralId) {
  const stash = arr(runState?.neutralStash)
  const i = stash.indexOf(neutralId)
  if (i === -1 || !NEUTRAL_ITEMS[neutralId]) return runState
  const rest = [...stash.slice(0, i), ...stash.slice(i + 1)]
  if (key === "commander") {
    const old = runState.commanderNeutral
    return { ...runState, commanderNeutral: neutralId, neutralStash: old ? [...rest, old] : rest }
  }
  const e = arr(runState.bench).find((b) => b.key === key)
  if (!e) return runState
  return {
    ...runState,
    bench: runState.bench.map((b) => (b.key === key ? { ...b, neutral: neutralId } : b)),
    neutralStash: e.neutral ? [...rest, e.neutral] : rest,
  }
}

export function unequipNeutral(runState, key) {
  if (key === "commander") {
    const old = runState?.commanderNeutral
    return old ? { ...runState, commanderNeutral: null, neutralStash: [...arr(runState.neutralStash), old] } : runState
  }
  const e = arr(runState?.bench).find((b) => b.key === key)
  if (!e?.neutral) return runState
  return { ...runState, bench: runState.bench.map((b) => (b.key === key ? { ...b, neutral: null } : b)), neutralStash: [...arr(runState.neutralStash), e.neutral] }
}
