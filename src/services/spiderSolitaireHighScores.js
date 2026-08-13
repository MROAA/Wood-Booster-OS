const STORAGE_KEY = "wood-booster-spider-solitaire-highscores"
const MAX_ENTRIES = 10

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveAll(all) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function getHighScores(difficulty) {
  const all = loadAll()
  return all[difficulty] || []
}

function addHighScore(difficulty, entry) {
  const all = loadAll()
  const list = [...(all[difficulty] || []), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES)

  all[difficulty] = list
  saveAll(all)

  const rank = list.findIndex((item) => item === entry)

  return {
    list,
    rank: rank === -1 ? null : rank + 1,
  }
}

export {
  getHighScores,
  addHighScore,
}
