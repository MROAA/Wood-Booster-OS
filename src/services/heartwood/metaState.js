// Hearthwood Trial - between-run meta progression. localStorage
// mechanics only, no knowledge of what a run looks like (same split as
// runSaveState.js). Marc: "meta-eteneminen runien välissä... jokainen
// run vie eteenpäin vaikka hävisi" - every run advances something even
// on a loss, the thing that makes it a real roguelike instead of a
// series of unconnected attempts.
//
// The store holds Acorns (the meta currency - you carry them out of the
// forest and plant them at the Guild Hall), which permanent perks have
// been bought (metaPerks.js), and a little lifetime stat block.
//
// Key: heartwood-meta-v1  (see runSaveState.js's key registry)

const META_KEY = "heartwood-meta-v1"
const META_VERSION = 1

function freshMeta() {
  return {
    version: META_VERSION,
    acorns: 0,
    chosenPerks: [],
    unlockedCommanders: [],
    // Depths (depths.js): `depth` is the highest one unlocked (0 = only
    // the base game), `selectedDepth` is what the next run will be
    // played at (0..depth).
    depth: 0,
    selectedDepth: 0,
    stats: { runs: 0, wins: 0, bestNodeIndex: 0 },
    // The Almanac (almanac.js): lifetime "discovered" ids per category,
    // unioned in when a run ends (HeartwoodBattle). Additive - a store
    // without it just starts empty, no META_VERSION bump.
    almanac: { units: [], enemies: [], relics: [], events: [] },
  }
}

// Always returns a usable object - a missing / corrupt / stale-version
// store just starts the player fresh rather than crashing the game.
export function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return freshMeta()
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== META_VERSION) return freshMeta()
    const depth = Number.isInteger(parsed.depth) && parsed.depth >= 0 ? parsed.depth : 0
    return {
      ...freshMeta(),
      ...parsed,
      chosenPerks: Array.isArray(parsed.chosenPerks) ? parsed.chosenPerks : [],
      unlockedCommanders: Array.isArray(parsed.unlockedCommanders) ? parsed.unlockedCommanders : [],
      depth,
      // never let a stale/hand-edited selectedDepth exceed what's unlocked
      selectedDepth: Math.max(0, Math.min(depth, parsed.selectedDepth | 0)),
      stats: { ...freshMeta().stats, ...(parsed.stats || {}) },
      almanac: {
        units: Array.isArray(parsed.almanac?.units) ? parsed.almanac.units : [],
        enemies: Array.isArray(parsed.almanac?.enemies) ? parsed.almanac.enemies : [],
        relics: Array.isArray(parsed.almanac?.relics) ? parsed.almanac.relics : [],
        events: Array.isArray(parsed.almanac?.events) ? parsed.almanac.events : [],
      },
    }
  } catch {
    return freshMeta()
  }
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify({ ...meta, version: META_VERSION }))
  } catch {
    // Progress is nice-to-have; the game stays fully playable if the
    // store is full or disabled.
  }
}

export function resetMeta() {
  try {
    localStorage.removeItem(META_KEY)
  } catch {
    // Nothing to do if storage itself is unavailable.
  }
  return freshMeta()
}
