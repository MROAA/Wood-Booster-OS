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
    stats: { runs: 0, wins: 0, bestNodeIndex: 0 },
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
    return {
      ...freshMeta(),
      ...parsed,
      chosenPerks: Array.isArray(parsed.chosenPerks) ? parsed.chosenPerks : [],
      unlockedCommanders: Array.isArray(parsed.unlockedCommanders) ? parsed.unlockedCommanders : [],
      stats: { ...freshMeta().stats, ...(parsed.stats || {}) },
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
