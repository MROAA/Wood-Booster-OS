const STORAGE_KEY = "wood-booster-spider-solitaire-save"

function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage voi olla täynnä tai pois käytöstä - peli jatkuu silti muistissa
  }
}

function clearGameState() {
  localStorage.removeItem(STORAGE_KEY)
}

export {
  loadGameState,
  saveGameState,
  clearGameState,
}
