// Hearthwood Trial - the seed engine (Seed System / Strategic Playstyle
// PRD sections 3-9). A run's `seed` (a 32-bit uint on runState, set in
// runEngine.js's startRun) is the run's fingerprint: the same seed
// rebuilds the same run STRUCTURE - route, shops, item shop, relics,
// rewards, events - and the player's decisions choose a path through
// it.
//
// The PRD's key rule (section 5): "eri jarjestelmilla pitaa olla omat
// RNG-streaminsa" - each system draws from its OWN named stream so one
// random event never desyncs the rest of the run. `streamRng(seed,
// stream, salt)` is that: a fresh deterministic generator keyed by the
// seed + a stream name + a per-call salt. The salt is always something
// reconstructible from runState (nodeIndex, a reroll counter, a bench
// key) so a save/reload reproduces the exact same next roll.
//
// SCOPE (v1): the run-preparation streams below. `combat` is listed for
// the map but is NOT wired this round - autoBattleEngine.js's
// weightedRandom move-select still rolls live Math.random, so a battle's
// blow-by-blow can still differ between two runs of the same seed. The
// whole PRE-battle experience is reproducible; combat is a later slice
// (its own fairness gate).

// The named RNG streams (PRD section 5). `world` is already deterministic
// via runEngine.js's mulberry32(seed) route shuffle (battleSlotsOf /
// reshuffleBattlePool) - it predates this file and is listed only so the
// full set is documented in one place.
export const SEED_STREAMS = ["world", "shop", "item", "loot", "event", "combat"]

// FNV-1a over the key string -> uint32. Small, fast, good enough spread
// for seeding a PRNG (not a cryptographic hash - it doesn't need to be).
export function hashStr(str) {
  let h = 0x811c9dc5
  const s = String(str)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// mulberry32 - the same tiny deterministic PRNG runEngine.js uses for
// the route seed. Local copy (this module must stay a leaf - runEngine
// imports it, not the other way round). Uniform in [0, 1), identical
// distribution to Math.random.
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A fresh generator for `stream` within run `seed`, offset by `salt`.
// Callers that draw more than once (a Fisher-Yates shuffle) keep the one
// returned function and let it advance; callers with a different salt get
// an independent sequence. Nothing about the generator's cursor is ever
// persisted - the same (seed, stream, salt) always yields the same
// generator, which is what makes a reload reproduce the roll.
export function streamRng(seed, stream, salt = 0) {
  return mulberry32(hashStr(`${seed >>> 0}:${stream}:${salt}`))
}

// 32-bit uint -> "HW-1A2B-3C4D": the shareable form shown on the Run Map
// and RunEndOverlay and typed back in on commander-select.
export function formatSeed(n) {
  const hex = (n >>> 0).toString(16).toUpperCase().padStart(8, "0")
  return `HW-${hex.slice(0, 4)}-${hex.slice(4)}`
}

// "HW-1a2b-3c4d" / "1A2B3C4D" / " hw 1a2b3c4d " -> 0x1A2B3C4D >>> 0.
// Tolerant of case, an optional HW prefix, and any spaces or dashes.
// 1-8 hex digits accepted (shorter is zero-padded on the left). Anything
// else - empty, non-hex, too long - returns null so callers can treat a
// bad paste as "just start a normal run".
export function parseSeed(str) {
  if (typeof str !== "string") return null
  let s = str.trim().toUpperCase()
  if (s.startsWith("HW")) s = s.slice(2)
  s = s.replace(/[\s-]/g, "")
  if (s.length === 0 || s.length > 8 || !/^[0-9A-F]+$/.test(s)) return null
  return parseInt(s, 16) >>> 0
}
