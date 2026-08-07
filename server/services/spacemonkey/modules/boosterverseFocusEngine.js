/**
 * Wood-Booster OS
 * Boosterverse Focus Engine
 *
 * ADHD-first huomionhallinta Spacemonkeylle.
 *
 * Tarkoitus:
 * - tunnistaa tämänhetkinen tärkein työasia
 * - vähentää turhaa kontekstia
 * - priorisoida tehtäviä
 * - auttaa palaamaan keskeytyksen jälkeen
 * - tarjota Spacemonkeylle pieni ja selkeä focus context
 *
 * Tämä moduuli EI:
 * - diagnosoi käyttäjää
 * - seuraa käyttäjää Wood-Booster OS:n ulkopuolella
 * - pakota käyttäjää tekemään mitään
 * - kutsu LLM:ää
 * - muuta projektidataa
 *
 * Se järjestää vain järjestelmän nykyistä kontekstia.
 */

const MODULE_ID = "boosterverse-focus-engine"
const MODULE_VERSION = "1.0.0"

const FOCUS_MODES = Object.freeze({
  NORMAL: "normal",
  FOCUS: "focus",
  DEEP_FOCUS: "deep-focus",
  RECOVERY: "recovery",
})

const PRIORITY_LEVELS = Object.freeze({
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  CRITICAL: "critical",
})

const MAX_VISIBLE_ITEMS = 5
const MAX_RECENT_FOCUS_HISTORY = 50

const state = {
  initialized: false,

  startedAt: null,
  updatedAt: null,

  mode: FOCUS_MODES.NORMAL,

  currentFocus: null,

  previousFocus: null,

  focusQueue: [],

  distractions: [],

  interruptedFocus: null,

  history: [],

  counters: {
    focusChanges: 0,
    interruptions: 0,
    recoveries: 0,
    itemsPrioritized: 0,
    distractionsHidden: 0,
  },
}


/**
 * Alustaa Focus Enginen.
 */
function initializeBoosterverseFocusEngine() {
  if (state.initialized) {
    return {
      success: true,
      status: "already-initialized",
      moduleId: MODULE_ID,
    }
  }

  const now = new Date().toISOString()

  state.initialized = true
  state.startedAt = now
  state.updatedAt = now

  return {
    success: true,
    status: "initialized",
    moduleId: MODULE_ID,
    version: MODULE_VERSION,
  }
}


/**
 * Asettaa Focus Moden.
 */
function setFocusMode(mode = FOCUS_MODES.NORMAL) {
  ensureInitialized()

  const safeMode = normalizeFocusMode(mode)

  state.mode = safeMode

  touch()

  addHistory({
    type: "focus-mode-changed",
    mode: safeMode,
  })

  return {
    success: true,
    mode: safeMode,
  }
}


/**
 * Asettaa tärkeimmän tämänhetkisen asian.
 *
 * Esimerkki:
 *
 * setCurrentFocus({
 *   type: "project",
 *   id: "aurora",
 *   title: "Aurora-pöytä",
 *   nextAction: "Pintakäsittely",
 *   priority: "high"
 * })
 */
function setCurrentFocus({
  type = "task",
  id = null,
  title = null,
  description = null,
  nextAction = null,
  priority = PRIORITY_LEVELS.NORMAL,
  projectId = null,
  customerId = null,
  source = "system",
  metadata = null,
} = {}) {
  ensureInitialized()

  const now = new Date().toISOString()

  if (state.currentFocus) {
    state.previousFocus =
      clone(state.currentFocus)
  }

  state.currentFocus = {
    type:
      sanitizeString(type) ||
      "task",

    id:
      sanitizeString(id),

    title:
      sanitizeString(title),

    description:
      sanitizeString(description),

    nextAction:
      sanitizeString(nextAction),

    priority:
      normalizePriority(priority),

    projectId:
      sanitizeString(projectId),

    customerId:
      sanitizeString(customerId),

    source:
      sanitizeString(source),

    metadata,

    startedAt: now,
    updatedAt: now,
  }

  state.counters.focusChanges += 1

  addHistory({
    type: "focus-changed",
    focus: clone(state.currentFocus),
  })

  touch()

  return {
    success: true,
    focus: clone(state.currentFocus),
  }
}


/**
 * Poistaa nykyisen focus-kohteen.
 */
function clearCurrentFocus({
  reason = null,
} = {}) {
  ensureInitialized()

  if (!state.currentFocus) {
    return {
      success: true,
      status: "already-clear",
    }
  }

  state.previousFocus =
    clone(state.currentFocus)

  addHistory({
    type: "focus-cleared",
    focus: clone(state.currentFocus),
    reason: sanitizeString(reason),
  })

  state.currentFocus = null

  touch()

  return {
    success: true,
    previousFocus:
      clone(state.previousFocus),
  }
}


/**
 * Lisää asian focus-jonoon.
 *
 * Jonon tarkoitus EI ole näyttää
 * käyttäjälle loputonta tehtävälistaa.
 *
 * Focus Context näyttää vain tärkeimmät.
 */
function addFocusItem({
  id = null,
  type = "task",
  title = null,
  description = null,
  nextAction = null,
  priority = PRIORITY_LEVELS.NORMAL,
  importance = 0.5,
  urgency = 0.5,
  dueAt = null,
  projectId = null,
  source = "system",
  metadata = null,
} = {}) {
  ensureInitialized()

  const itemId =
    sanitizeString(id) ||
    createId("bv-focus-item")

  const existingIndex =
    state.focusQueue.findIndex(
      (item) => item.id === itemId
    )

  const item = {
    id: itemId,

    type:
      sanitizeString(type) ||
      "task",

    title:
      sanitizeString(title),

    description:
      sanitizeString(description),

    nextAction:
      sanitizeString(nextAction),

    priority:
      normalizePriority(priority),

    importance:
      clampNumber(
        importance,
        0,
        1
      ),

    urgency:
      clampNumber(
        urgency,
        0,
        1
      ),

    dueAt:
      sanitizeString(dueAt),

    projectId:
      sanitizeString(projectId),

    source:
      sanitizeString(source),

    metadata,

    updatedAt:
      new Date().toISOString(),
  }

  item.score =
    calculateFocusScore(item)

  if (existingIndex >= 0) {
    state.focusQueue[
      existingIndex
    ] = item
  } else {
    state.focusQueue.push(item)
  }

  state.counters.itemsPrioritized += 1

  sortFocusQueue()

  touch()

  return {
    success: true,
    item: clone(item),
  }
}


/**
 * Poistaa asian focus-jonosta.
 */
function removeFocusItem(itemId) {
  ensureInitialized()

  const safeId =
    sanitizeString(itemId)

  const previousLength =
    state.focusQueue.length

  state.focusQueue =
    state.focusQueue.filter(
      (item) =>
        item.id !== safeId
    )

  const removed =
    state.focusQueue.length <
    previousLength

  touch()

  return {
    success: true,
    removed,
  }
}


/**
 * Merkitsee asian häiriöksi.
 *
 * Häiriö ei tarkoita että asia olisi turha.
 * Se tarkoittaa vain, ettei sitä tarvitse
 * näyttää nykyisessä fokuksessa.
 */
function markDistraction({
  id = null,
  type = "context",
  title = null,
  reason = null,
  until = null,
  metadata = null,
} = {}) {
  ensureInitialized()

  const distraction = {
    id:
      sanitizeString(id) ||
      createId(
        "bv-distraction"
      ),

    type:
      sanitizeString(type) ||
      "context",

    title:
      sanitizeString(title),

    reason:
      sanitizeString(reason),

    until:
      sanitizeString(until),

    metadata,

    createdAt:
      new Date().toISOString(),
  }

  state.distractions.push(
    distraction
  )

  state.counters
    .distractionsHidden += 1

  touch()

  return {
    success: true,
    distraction:
      clone(distraction),
  }
}


/**
 * Poistaa häiriömerkinnän.
 */
function clearDistraction(id) {
  ensureInitialized()

  const safeId =
    sanitizeString(id)

  state.distractions =
    state.distractions.filter(
      (item) =>
        item.id !== safeId
    )

  touch()

  return {
    success: true,
  }
}


/**
 * Tallentaa keskeytyksen.
 *
 * Tämä mahdollistaa myöhemmin:
 *
 * "Viimeksi olit tekemässä tätä."
 */
function registerInterruption({
  reason = null,
  source = "system",
} = {}) {
  ensureInitialized()

  if (!state.currentFocus) {
    return {
      success: false,
      error:
        "No active focus to interrupt",
    }
  }

  state.interruptedFocus = {
    focus:
      clone(state.currentFocus),

    reason:
      sanitizeString(reason),

    source:
      sanitizeString(source),

    interruptedAt:
      new Date().toISOString(),
  }

  state.counters.interruptions += 1

  addHistory({
    type: "focus-interrupted",
    interruptedFocus:
      clone(
        state.interruptedFocus
      ),
  })

  touch()

  return {
    success: true,

    interruptedFocus:
      clone(
        state.interruptedFocus
      ),
  }
}


/**
 * Palauttaa keskeytyneen työn.
 */
function recoverInterruptedFocus() {
  ensureInitialized()

  if (!state.interruptedFocus) {
    return {
      success: false,
      error:
        "No interrupted focus available",
    }
  }

  const recovered =
    clone(
      state.interruptedFocus
        .focus
    )

  state.previousFocus =
    state.currentFocus
      ? clone(
          state.currentFocus
        )
      : null

  state.currentFocus =
    recovered

  state.currentFocus.updatedAt =
    new Date().toISOString()

  const interruption =
    clone(
      state.interruptedFocus
    )

  state.interruptedFocus = null

  state.mode =
    FOCUS_MODES.RECOVERY

  state.counters.recoveries += 1
  state.counters.focusChanges += 1

  addHistory({
    type: "focus-recovered",
    focus:
      clone(state.currentFocus),
    interruption,
  })

  touch()

  return {
    success: true,

    mode:
      state.mode,

    focus:
      clone(state.currentFocus),

    interruption,
  }
}


/**
 * Valitsee focus-jonosta tärkeimmän asian.
 *
 * Ei käytä LLM:ää.
 * Valinta perustuu läpinäkyvään scoreen.
 */
function selectBestFocusItem() {
  ensureInitialized()

  sortFocusQueue()

  const best =
    state.focusQueue[0]

  if (!best) {
    return {
      success: false,
      error:
        "Focus queue is empty",
    }
  }

  return setCurrentFocus({
    type:
      best.type,

    id:
      best.id,

    title:
      best.title,

    description:
      best.description,

    nextAction:
      best.nextAction,

    priority:
      best.priority,

    projectId:
      best.projectId,

    source:
      "focus-engine",

    metadata: {
      focusScore:
        best.score,

      originalSource:
        best.source,
    },
  })
}


/**
 * Palauttaa vain tärkeimmät näkyvät asiat.
 *
 * Tämä on käyttöliittymän ja Spacemonkeyn
 * ADHD-first context.
 */
function getVisibleFocusItems(
  limit =
    MAX_VISIBLE_ITEMS
) {
  ensureInitialized()

  cleanupExpiredDistractions()

  const hiddenIds =
    new Set(
      state.distractions
        .map(
          (item) =>
            item.id
        )
        .filter(Boolean)
    )

  return state.focusQueue
    .filter(
      (item) =>
        !hiddenIds.has(
          item.id
        )
    )
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(
      0,
      Math.max(
        1,
        Math.min(
          Number(limit) ||
            MAX_VISIBLE_ITEMS,
          MAX_VISIBLE_ITEMS
        )
      )
    )
    .map(clone)
}


/**
 * Palauttaa Spacemonkeylle pienen,
 * tarkoituksella rajoitetun
 * Focus Contextin.
 */
function getFocusContext() {
  ensureInitialized()

  return clone({
    mode:
      state.mode,

    primaryFocus:
      state.currentFocus,

    nextItems:
      getVisibleFocusItems(3),

    interruptedFocus:
      state.interruptedFocus,

    previousFocus:
      state.previousFocus,

    guidance:
      buildFocusGuidance(),
  })
}


/**
 * Käyttöliittymälle tarkoitettu
 * kevyt focus-yhteenveto.
 */
function getFocusSummary() {
  ensureInitialized()

  return {
    mode:
      state.mode,

    currentFocus:
      clone(
        state.currentFocus
      ),

    queuedItems:
      state.focusQueue.length,

    visibleItems:
      getVisibleFocusItems()
        .length,

    hiddenDistractions:
      state.distractions.length,

    recoverable:
      Boolean(
        state.interruptedFocus
      ),

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Focus-historia.
 */
function getFocusHistory(
  limit = 20
) {
  ensureInitialized()

  return state.history
    .slice(
      -Math.max(
        1,
        Math.min(
          Number(limit) || 20,
          MAX_RECENT_FOCUS_HISTORY
        )
      )
    )
    .reverse()
    .map(clone)
}


/**
 * Health check.
 */
function getBoosterverseFocusEngineHealth() {
  return {
    moduleId:
      MODULE_ID,

    version:
      MODULE_VERSION,

    healthy:
      true,

    status:
      state.initialized
        ? "running"
        : "idle",

    metrics: {
      focusChanges:
        state.counters
          .focusChanges,

      interruptions:
        state.counters
          .interruptions,

      recoveries:
        state.counters
          .recoveries,

      queuedItems:
        state.focusQueue.length,

      hiddenDistractions:
        state.distractions
          .length,
    },

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Runtime-state reset testeihin.
 */
function resetFocusEngine() {
  ensureInitialized()

  state.mode =
    FOCUS_MODES.NORMAL

  state.currentFocus = null
  state.previousFocus = null

  state.focusQueue = []
  state.distractions = []

  state.interruptedFocus = null

  state.history = []

  touch()

  return {
    success: true,
    status: "reset",
  }
}


/**
 * Focus score.
 *
 * Läpinäkyvä laskenta:
 *
 * priority   35 %
 * importance 30 %
 * urgency    25 %
 * deadline   10 %
 */
function calculateFocusScore(
  item
) {
  const priorityScore =
    priorityToScore(
      item.priority
    )

  const importance =
    clampNumber(
      item.importance,
      0,
      1
    )

  const urgency =
    clampNumber(
      item.urgency,
      0,
      1
    )

  const deadline =
    calculateDeadlineScore(
      item.dueAt
    )

  return clampNumber(
    priorityScore * 0.35 +
      importance * 0.30 +
      urgency * 0.25 +
      deadline * 0.10,
    0,
    1
  )
}


/**
 * Deadline lähestyy -> score kasvaa.
 */
function calculateDeadlineScore(
  dueAt
) {
  if (!dueAt) {
    return 0
  }

  const due =
    new Date(dueAt)

  if (
    Number.isNaN(
      due.getTime()
    )
  ) {
    return 0
  }

  const now = Date.now()

  const difference =
    due.getTime() - now

  const oneDay =
    24 * 60 * 60 * 1000

  if (difference <= 0) {
    return 1
  }

  const days =
    difference / oneDay

  if (days <= 1) {
    return 1
  }

  if (days <= 3) {
    return 0.8
  }

  if (days <= 7) {
    return 0.6
  }

  if (days <= 14) {
    return 0.3
  }

  return 0.1
}


/**
 * Priority -> numeric score.
 */
function priorityToScore(
  priority
) {
  switch (
    normalizePriority(
      priority
    )
  ) {
    case PRIORITY_LEVELS.CRITICAL:
      return 1

    case PRIORITY_LEVELS.HIGH:
      return 0.8

    case PRIORITY_LEVELS.NORMAL:
      return 0.5

    case PRIORITY_LEVELS.LOW:
      return 0.2

    default:
      return 0.5
  }
}


/**
 * Rakentaa yksinkertaisen
 * focus-ohjauksen.
 *
 * Ei LLM:ää.
 */
function buildFocusGuidance() {
  if (state.interruptedFocus) {
    return {
      type:
        "recovery-available",

      message:
        "Previous work can be restored.",
    }
  }

  if (state.currentFocus) {
    return {
      type:
        "continue-current-focus",

      message:
        state.currentFocus
          .nextAction ||
        state.currentFocus
          .title ||
        "Continue current work.",
    }
  }

  if (
    state.focusQueue.length > 0
  ) {
    return {
      type:
        "focus-available",

      message:
        "A prioritized focus item is available.",
    }
  }

  return {
    type:
      "no-focus",

    message:
      "No immediate focus item is active.",
  }
}


function sortFocusQueue() {
  state.focusQueue.sort(
    (a, b) =>
      b.score - a.score
  )
}


function cleanupExpiredDistractions() {
  const now = Date.now()

  state.distractions =
    state.distractions.filter(
      (item) => {
        if (!item.until) {
          return true
        }

        const until =
          new Date(
            item.until
          ).getTime()

        if (
          Number.isNaN(
            until
          )
        ) {
          return true
        }

        return until > now
      }
    )
}


function addHistory(entry) {
  state.history.push({
    ...entry,
    timestamp:
      new Date().toISOString(),
  })

  if (
    state.history.length >
    MAX_RECENT_FOCUS_HISTORY
  ) {
    state.history =
      state.history.slice(
        -MAX_RECENT_FOCUS_HISTORY
      )
  }
}


function normalizeFocusMode(
  mode
) {
  const safe =
    sanitizeString(mode)

  const values =
    Object.values(
      FOCUS_MODES
    )

  return values.includes(safe)
    ? safe
    : FOCUS_MODES.NORMAL
}


function normalizePriority(
  priority
) {
  const safe =
    sanitizeString(priority)

  const values =
    Object.values(
      PRIORITY_LEVELS
    )

  return values.includes(safe)
    ? safe
    : PRIORITY_LEVELS.NORMAL
}


function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}


function sanitizeString(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const string =
    String(value).trim()

  return string || null
}


function clampNumber(
  value,
  min,
  max
) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return min
  }

  return Math.min(
    Math.max(
      number,
      min
    ),
    max
  )
}


function touch() {
  state.updatedAt =
    new Date().toISOString()
}


function ensureInitialized() {
  if (!state.initialized) {
    initializeBoosterverseFocusEngine()
  }
}


function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  )
}


export {
  MODULE_ID,
  MODULE_VERSION,

  FOCUS_MODES,
  PRIORITY_LEVELS,

  initializeBoosterverseFocusEngine,

  setFocusMode,

  setCurrentFocus,

  clearCurrentFocus,

  addFocusItem,

  removeFocusItem,

  markDistraction,

  clearDistraction,

  registerInterruption,

  recoverInterruptedFocus,

  selectBestFocusItem,

  getVisibleFocusItems,

  getFocusContext,

  getFocusSummary,

  getFocusHistory,

  getBoosterverseFocusEngineHealth,

  resetFocusEngine,
}


export default {
  id: MODULE_ID,

  name:
    "Boosterverse Focus Engine",

  version:
    MODULE_VERSION,

  description:
    "ADHD-first huomionhallinta-, priorisointi- ja keskeytyksestä palautumisen kerros Spacemonkeylle.",

  initialize:
    initializeBoosterverseFocusEngine,

  setFocusMode,

  setCurrentFocus,

  clearCurrentFocus,

  addFocusItem,

  removeFocusItem,

  markDistraction,

  registerInterruption,

  recoverInterruptedFocus,

  selectBestFocusItem,

  getVisibleFocusItems,

  getFocusContext,

  getFocusSummary,

  getFocusHistory,

  health:
    getBoosterverseFocusEngineHealth,
}
