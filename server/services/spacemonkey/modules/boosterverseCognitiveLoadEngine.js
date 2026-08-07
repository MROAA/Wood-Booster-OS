/**
 * Wood-Booster OS
 * Boosterverse Cognitive Load Engine
 *
 * Tarkoitus:
 * - arvioida käyttöympäristön tämänhetkistä kognitiivista kuormaa
 * - huomioida avoimet projektit, tehtävät, ilmoitukset ja keskeytykset
 * - auttaa Focus Engineä ja käyttöliittymää vähentämään hälyä
 * - tarjota Spacemonkeylle selkeä kuormitustaso
 *
 * TÄMÄ MODUULI EI:
 * - diagnosoi käyttäjää
 * - arvioi käyttäjän mielenterveyttä
 * - seuraa käyttäjää Wood-Booster OS:n ulkopuolella
 * - tee lääketieteellisiä päätelmiä
 * - muuta käyttöliittymää itsenäisesti
 *
 * Se arvioi vain järjestelmän aiheuttamaa työkuormaa.
 */

const MODULE_ID =
  "boosterverse-cognitive-load-engine"

const MODULE_VERSION =
  "1.0.0"

const LOAD_LEVELS = Object.freeze({
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  OVERLOAD: "overload",
})

const MAX_HISTORY = 200

const DEFAULT_WEIGHTS = Object.freeze({
  openProjects: 0.15,
  openTasks: 0.2,
  notifications: 0.15,
  interruptions: 0.2,
  contextSwitches: 0.2,
  blockedWork: 0.1,
})

const state = {
  initialized: false,

  startedAt: null,
  updatedAt: null,

  currentAssessment: null,

  history: [],

  counters: {
    assessments: 0,
    low: 0,
    normal: 0,
    high: 0,
    overload: 0,
  },
}


/**
 * Alustaa Cognitive Load Enginen.
 */
function initializeBoosterverseCognitiveLoadEngine() {
  if (state.initialized) {
    return {
      success: true,
      status: "already-initialized",
      moduleId: MODULE_ID,
    }
  }

  const now =
    new Date().toISOString()

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
 * Arvioi järjestelmän tämänhetkisen kuormituksen.
 *
 * Input-esimerkki:
 *
 * {
 *   openProjects: 4,
 *   openTasks: 12,
 *   notifications: 3,
 *   interruptions: 5,
 *   contextSwitches: 8,
 *   blockedWork: 2
 * }
 */
function assessCognitiveLoad({
  openProjects = 0,
  openTasks = 0,
  notifications = 0,
  interruptions = 0,
  contextSwitches = 0,
  blockedWork = 0,

  weights = null,

  source = "system",

  metadata = null,
} = {}) {
  ensureInitialized()

  const safeWeights =
    normalizeWeights(
      weights
    )

  const normalized = {
    openProjects:
      normalizeCount(
        openProjects,
        8
      ),

    openTasks:
      normalizeCount(
        openTasks,
        30
      ),

    notifications:
      normalizeCount(
        notifications,
        15
      ),

    interruptions:
      normalizeCount(
        interruptions,
        12
      ),

    contextSwitches:
      normalizeCount(
        contextSwitches,
        20
      ),

    blockedWork:
      normalizeCount(
        blockedWork,
        10
      ),
  }

  const score =
    clampNumber(
      normalized.openProjects *
        safeWeights.openProjects +

      normalized.openTasks *
        safeWeights.openTasks +

      normalized.notifications *
        safeWeights.notifications +

      normalized.interruptions *
        safeWeights.interruptions +

      normalized.contextSwitches *
        safeWeights.contextSwitches +

      normalized.blockedWork *
        safeWeights.blockedWork,
      0,
      1
    )

  const level =
    scoreToLoadLevel(
      score
    )

  const now =
    new Date().toISOString()

  const assessment = {
    id:
      createId(
        "bv-load"
      ),

    score,

    level,

    source:
      sanitizeString(source),

    raw: {
      openProjects:
        safeInteger(
          openProjects
        ),

      openTasks:
        safeInteger(
          openTasks
        ),

      notifications:
        safeInteger(
          notifications
        ),

      interruptions:
        safeInteger(
          interruptions
        ),

      contextSwitches:
        safeInteger(
          contextSwitches
        ),

      blockedWork:
        safeInteger(
          blockedWork
        ),
    },

    normalized,

    weights:
      safeWeights,

    guidance:
      buildGuidance(
        level
      ),

    metadata,

    createdAt:
      now,

    updatedAt:
      now,
  }

  state.currentAssessment =
    assessment

  state.history.push(
    assessment
  )

  trimHistory()

  state.counters.assessments += 1
  incrementLevelCounter(
    level
  )

  touch()

  return {
    success: true,
    assessment:
      clone(
        assessment
      ),
  }
}


/**
 * Arvioi kuorman suoraan runtime-contextista.
 *
 * Tämän voi myöhemmin liittää:
 *
 * World State
 * Focus Engine
 * Workflow Engine
 */
function assessFromRuntimeContext(
  context = {}
) {
  ensureInitialized()

  const world =
    context.world ||
    {}

  const focus =
    context.focus ||
    {}

  const workflow =
    context.workflow ||
    {}

  const recentEvents =
    Array.isArray(
      world.recentEvents
    )
      ? world.recentEvents
      : []

  const openProjects =
    safeInteger(
      context.openProjects ??
      0
    )

  const openTasks =
    safeInteger(
      context.openTasks ??
      focus.nextItems?.length ??
      0
    )

  const notifications =
    safeInteger(
      context.notifications ??
      0
    )

  const interruptions =
    countInterruptionEvents(
      recentEvents
    ) +
    (
      focus.interruptedFocus
        ? 1
        : 0
    )

  const contextSwitches =
    countContextSwitchEvents(
      recentEvents
    )

  const blockedWork =
    workflow.waiting
      ? 1
      : 0

  return assessCognitiveLoad({
    openProjects,
    openTasks,
    notifications,
    interruptions,
    contextSwitches,
    blockedWork,

    source:
      "runtime-context",

    metadata: {
      runtimeTimestamp:
        context.timestamp ??
        null,
    },
  })
}


/**
 * Palauttaa viimeisimmän arvion.
 */
function getCurrentCognitiveLoad() {
  ensureInitialized()

  return state.currentAssessment
    ? clone(
        state.currentAssessment
      )
    : {
        score: 0,
        level:
          LOAD_LEVELS.LOW,

        guidance:
          buildGuidance(
            LOAD_LEVELS.LOW
          ),
      }
}


/**
 * Palauttaa Spacemonkeylle pienen contextin.
 */
function getCognitiveLoadContext() {
  ensureInitialized()

  const current =
    getCurrentCognitiveLoad()

  return {
    score:
      current.score,

    level:
      current.level,

    guidance:
      current.guidance,

    rule:
      "Reduce visible complexity when cognitive load is high. Never infer medical state from this score.",
  }
}


/**
 * UI:lle tarkoitettu yhteenveto.
 */
function getCognitiveLoadSummary() {
  ensureInitialized()

  return {
    current:
      state.currentAssessment
        ? {
            score:
              state
                .currentAssessment
                .score,

            level:
              state
                .currentAssessment
                .level,

            guidance:
              state
                .currentAssessment
                .guidance,

            updatedAt:
              state
                .currentAssessment
                .updatedAt,
          }
        : null,

    counters:
      clone(
        state.counters
      ),

    assessmentsStored:
      state.history.length,

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Historia.
 */
function getCognitiveLoadHistory(
  limit = 30
) {
  ensureInitialized()

  return state.history
    .slice(
      -Math.max(
        1,
        Math.min(
          Number(limit) || 30,
          MAX_HISTORY
        )
      )
    )
    .reverse()
    .map(clone)
}


/**
 * Health check.
 */
function getBoosterverseCognitiveLoadEngineHealth() {
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

    metrics:
      getCognitiveLoadSummary(),
  }
}


/**
 * Reset testeihin.
 */
function resetCognitiveLoadEngine() {
  ensureInitialized()

  state.currentAssessment =
    null

  state.history = []

  state.counters = {
    assessments: 0,
    low: 0,
    normal: 0,
    high: 0,
    overload: 0,
  }

  touch()

  return {
    success: true,
    status: "reset",
  }
}


/**
 * Muuttaa raakalukumäärän 0..1 asteikolle.
 */
function normalizeCount(
  value,
  maximum
) {
  const number =
    safeInteger(
      value
    )

  return clampNumber(
    number /
      Math.max(
        1,
        Number(maximum) || 1
      ),
    0,
    1
  )
}


/**
 * Score -> kuormitustaso.
 */
function scoreToLoadLevel(
  score
) {
  const safe =
    clampNumber(
      score,
      0,
      1
    )

  if (safe >= 0.75) {
    return LOAD_LEVELS.OVERLOAD
  }

  if (safe >= 0.5) {
    return LOAD_LEVELS.HIGH
  }

  if (safe >= 0.25) {
    return LOAD_LEVELS.NORMAL
  }

  return LOAD_LEVELS.LOW
}


/**
 * Käytännöllinen ohjaus.
 *
 * Tämä ei tee mitään itse.
 * Focus/UI voi myöhemmin käyttää tätä.
 */
function buildGuidance(
  level
) {
  switch (level) {
    case LOAD_LEVELS.OVERLOAD:
      return {
        mode:
          "reduce-complexity",

        visibleItems:
          1,

        suppressNonCriticalNotifications:
          true,

        suggestion:
          "Show only the single most important active task.",
      }

    case LOAD_LEVELS.HIGH:
      return {
        mode:
          "focus",

        visibleItems:
          3,

        suppressNonCriticalNotifications:
          true,

        suggestion:
          "Reduce visible work and prioritize the current project.",
      }

    case LOAD_LEVELS.NORMAL:
      return {
        mode:
          "normal",

        visibleItems:
          5,

        suppressNonCriticalNotifications:
          false,

        suggestion:
          "Keep the workspace calm and show only relevant context.",
      }

    case LOAD_LEVELS.LOW:
    default:
      return {
        mode:
          "normal",

        visibleItems:
          5,

        suppressNonCriticalNotifications:
          false,

        suggestion:
          "Current system load is low.",
      }
  }
}


/**
 * Laskee interruption-tyyppisiä eventtejä.
 */
function countInterruptionEvents(
  events
) {
  if (!Array.isArray(events)) {
    return 0
  }

  return events.filter(
    (event) => {
      const text =
        [
          event?.type,
          event?.message,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

      return (
        text.includes(
          "interrupt"
        ) ||
        text.includes(
          "cancel"
        ) ||
        text.includes(
          "pause"
        )
      )
    }
  ).length
}


/**
 * Laskee sivu-/kontekstinvaihtoja.
 */
function countContextSwitchEvents(
  events
) {
  if (!Array.isArray(events)) {
    return 0
  }

  return events.filter(
    (event) => {
      const type =
        sanitizeString(
          event?.type
        )
          ?.toLowerCase() ||
        ""

      return (
        type.includes(
          "page.changed"
        ) ||
        type.includes(
          "project.opened"
        ) ||
        type.includes(
          "context.changed"
        )
      )
    }
  ).length
}


/**
 * Painojen normalisointi.
 */
function normalizeWeights(
  customWeights
) {
  if (
    !customWeights ||
    typeof customWeights !==
      "object"
  ) {
    return clone(
      DEFAULT_WEIGHTS
    )
  }

  const merged = {
    ...DEFAULT_WEIGHTS,
    ...customWeights,
  }

  const safe = {}

  let total = 0

  for (
    const key
    of Object.keys(
      DEFAULT_WEIGHTS
    )
  ) {
    safe[key] =
      clampNumber(
        merged[key],
        0,
        1
      )

    total += safe[key]
  }

  if (total <= 0) {
    return clone(
      DEFAULT_WEIGHTS
    )
  }

  for (
    const key
    of Object.keys(safe)
  ) {
    safe[key] =
      safe[key] / total
  }

  return safe
}


function incrementLevelCounter(
  level
) {
  if (
    Object.prototype.hasOwnProperty.call(
      state.counters,
      level
    )
  ) {
    state.counters[level] += 1
  }
}


function trimHistory() {
  if (
    state.history.length >
    MAX_HISTORY
  ) {
    state.history =
      state.history.slice(
        -MAX_HISTORY
      )
  }
}


function safeInteger(value) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return 0
  }

  return Math.max(
    0,
    Math.floor(number)
  )
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
    initializeBoosterverseCognitiveLoadEngine()
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

  LOAD_LEVELS,

  initializeBoosterverseCognitiveLoadEngine,

  assessCognitiveLoad,

  assessFromRuntimeContext,

  getCurrentCognitiveLoad,

  getCognitiveLoadContext,

  getCognitiveLoadSummary,

  getCognitiveLoadHistory,

  getBoosterverseCognitiveLoadEngineHealth,

  resetCognitiveLoadEngine,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Cognitive Load Engine",

  version:
    MODULE_VERSION,

  description:
    "ADHD-first järjestelmäkuorman arviointi- ja käyttöliittymän rauhoittamista tukeva Boosterverse-moduuli.",

  initialize:
    initializeBoosterverseCognitiveLoadEngine,

  assessCognitiveLoad,

  assessFromRuntimeContext,

  getCurrentCognitiveLoad,

  getCognitiveLoadContext,

  getCognitiveLoadSummary,

  getCognitiveLoadHistory,

  health:
    getBoosterverseCognitiveLoadEngineHealth,
}
