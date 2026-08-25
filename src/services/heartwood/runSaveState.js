// Heartwood Trial - localStorage mechanics only, no knowledge of what a
// run actually looks like (that shape lives in runEngine.js's
// serializeRun/deserializeRun). Mirrors the existing
// spiderSolitaireSaveState.js precedent: try/catch, silent failure on a
// disabled/full store - the game must stay fully playable even if
// nothing can be persisted.
//
// Keys in use, so a future session doesn't collide with these:
//   heartwood-autobattler-intro-seen  - "seen the how-to-play tutorial" flag (HeartwoodBattle.jsx, untouched by this module)
//   heartwood-run-save-v1             - the in-progress run (this module)
//   heartwood-last-run-v1             - lightweight cross-run memory, written once when a run ends (this module)

const RUN_SAVE_KEY = "heartwood-run-save-v1"
const LAST_RUN_KEY = "heartwood-last-run-v1"

function loadRunSave() {
  try {
    const raw = localStorage.getItem(RUN_SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveRunSave(saved) {
  try {
    localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(saved))
  } catch {
    // localStorage can be full or disabled - the run keeps playing in memory either way.
  }
}

function clearRunSave() {
  try {
    localStorage.removeItem(RUN_SAVE_KEY)
  } catch {
    // Nothing to do if storage itself is unavailable.
  }
}

function loadLastRun() {
  try {
    const raw = localStorage.getItem(LAST_RUN_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveLastRun(summary) {
  try {
    localStorage.setItem(LAST_RUN_KEY, JSON.stringify(summary))
  } catch {
    // Display-only memory - safe to silently drop.
  }
}

function clearLastRun() {
  try {
    localStorage.removeItem(LAST_RUN_KEY)
  } catch {
    // Nothing to do if storage itself is unavailable.
  }
}

export { loadRunSave, saveRunSave, clearRunSave, loadLastRun, saveLastRun, clearLastRun }
