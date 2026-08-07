/**
 * Wood-Booster OS
 * Boosterverse Intent Engine
 *
 * Tarkoitus:
 * - arvioida käyttäjän tämänhetkinen tavoite
 * - yhdistää page + project + focus + events + tool
 * - tarjota Spacemonkeylle läpinäkyvä intent-arvio
 * - mahdollistaa myöhemmin Goal- ja Planning Engine
 *
 * Tämä moduuli EI:
 * - kutsu LLM:ää
 * - seuraa käyttäjää Wood-Booster OS:n ulkopuolella
 * - tee päätöksiä käyttäjän puolesta
 * - käynnistä automaatioita
 *
 * Intent on aina arvio, ei varma fakta.
 */

const MODULE_ID = "boosterverse-intent-engine"
const MODULE_VERSION = "1.0.0"

const INTENT_TYPES = Object.freeze({
  UNKNOWN: "unknown",

  CONTINUE_WORK: "continue-work",
  VIEW_PROJECT: "view-project",
  EDIT_PROJECT: "edit-project",

  PLAN_WORK: "plan-work",
  COMPLETE_TASK: "complete-task",

  CREATE_QUOTE: "create-quote",
  REVIEW_COSTS: "review-costs",

  MANAGE_MATERIALS: "manage-materials",
  CHECK_INVENTORY: "check-inventory",

  MANAGE_CUSTOMER: "manage-customer",

  FIND_INFORMATION: "find-information",
  DOCUMENT_WORK: "document-work",

  EDIT_MEDIA: "edit-media",
  PREPARE_SOCIAL: "prepare-social",

  REVIEW_PROGRESS: "review-progress",
  RESUME_INTERRUPTED_WORK: "resume-interrupted-work",
})

const MAX_HISTORY = 100

const state = {
  initialized: false,

  startedAt: null,
  updatedAt: null,

  currentIntent: null,

  candidates: [],

  history: [],

  counters: {
    evaluations: 0,
    intentChanges: 0,
    unknownResults: 0,
  },
}


/**
 * Alustus.
 */
function initializeBoosterverseIntentEngine() {
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
 * Arvioi intentin annetusta live-contextista.
 *
 * Suositeltu input:
 *
 * {
 *   page,
 *   route,
 *   project,
 *   customer,
 *   workflow,
 *   task,
 *   tool,
 *   recentEvents,
 *   focus
 * }
 */
function evaluateIntent(context = {}) {
  ensureInitialized()

  state.counters.evaluations += 1

  const candidates = []

  evaluateRecoveryIntent(
    context,
    candidates
  )

  evaluateQuoteIntent(
    context,
    candidates
  )

  evaluateMaterialIntent(
    context,
    candidates
  )

  evaluateMediaIntent(
    context,
    candidates
  )

  evaluateCustomerIntent(
    context,
    candidates
  )

  evaluateKnowledgeIntent(
    context,
    candidates
  )

  evaluateProjectIntent(
    context,
    candidates
  )

  evaluateTaskIntent(
    context,
    candidates
  )

  evaluateGeneralFocusIntent(
    context,
    candidates
  )

  const sorted =
    candidates
      .filter(
        (item) =>
          item &&
          Number.isFinite(
            item.score
          )
      )
      .sort(
        (a, b) =>
          b.score - a.score
      )

  state.candidates =
    sorted.slice(0, 10)

  const best =
    sorted[0] ||
    createUnknownIntent()

  updateCurrentIntent(best)

  touch()

  return {
    success: true,

    intent:
      clone(
        state.currentIntent
      ),

    candidates:
      clone(
        state.candidates
      ),
  }
}


/**
 * Keskeytyksestä palautuminen.
 */
function evaluateRecoveryIntent(
  context,
  candidates
) {
  const interrupted =
    context?.focus
      ?.interruptedFocus

  const mode =
    sanitizeString(
      context?.focus?.mode
    )

  if (
    interrupted ||
    mode === "recovery"
  ) {
    candidates.push(
      createCandidate({
        type:
          INTENT_TYPES
            .RESUME_INTERRUPTED_WORK,

        score: 0.95,

        reason:
          "Interrupted work is available for recovery.",

        evidence: [
          "focus.interruptedFocus",
          "focus.mode",
        ],
      })
    )
  }
}


/**
 * Tarjouksiin liittyvä intent.
 */
function evaluateQuoteIntent(
  context,
  candidates
) {
  const page =
    normalizedText(
      context.page
    )

  const route =
    normalizedText(
      context.route
    )

  const tool =
    normalizedText(
      context.tool
    )

  const eventText =
    recentEventText(
      context.recentEvents
    )

  let score = 0

  const evidence = []

  if (
    containsAny(
      page,
      [
        "quote",
        "offer",
        "tarjous",
      ]
    )
  ) {
    score += 0.45
    evidence.push("page")
  }

  if (
    containsAny(
      route,
      [
        "quote",
        "offer",
        "tarjous",
      ]
    )
  ) {
    score += 0.25
    evidence.push("route")
  }

  if (
    containsAny(
      tool,
      [
        "quote",
        "pricing",
        "cost",
      ]
    )
  ) {
    score += 0.25
    evidence.push("tool")
  }

  if (
    containsAny(
      eventText,
      [
        "price",
        "cost",
        "quote",
        "tarjous",
      ]
    )
  ) {
    score += 0.15
    evidence.push("recentEvents")
  }

  if (score > 0) {
    candidates.push(
      createCandidate({
        type:
          score >= 0.7
            ? INTENT_TYPES.CREATE_QUOTE
            : INTENT_TYPES.REVIEW_COSTS,

        score:
          clampNumber(
            score,
            0,
            1
          ),

        reason:
          "Current context indicates pricing or quote work.",

        evidence,
      })
    )
  }
}


/**
 * Materiaalit / varasto.
 */
function evaluateMaterialIntent(
  context,
  candidates
) {
  const page =
    normalizedText(
      context.page
    )

  const route =
    normalizedText(
      context.route
    )

  const tool =
    normalizedText(
      context.tool
    )

  let score = 0

  const evidence = []

  if (
    containsAny(
      page,
      [
        "material",
        "inventory",
        "varasto",
      ]
    )
  ) {
    score += 0.5
    evidence.push("page")
  }

  if (
    containsAny(
      route,
      [
        "material",
        "inventory",
      ]
    )
  ) {
    score += 0.25
    evidence.push("route")
  }

  if (
    containsAny(
      tool,
      [
        "material",
        "inventory",
      ]
    )
  ) {
    score += 0.25
    evidence.push("tool")
  }

  if (score > 0) {
    candidates.push(
      createCandidate({
        type:
          score >= 0.7
            ? INTENT_TYPES.MANAGE_MATERIALS
            : INTENT_TYPES.CHECK_INVENTORY,

        score:
          clampNumber(
            score,
            0,
            1
          ),

        reason:
          "Current context indicates material or inventory work.",

        evidence,
      })
    )
  }
}


/**
 * Media / some.
 */
function evaluateMediaIntent(
  context,
  candidates
) {
  const page =
    normalizedText(
      context.page
    )

  const route =
    normalizedText(
      context.route
    )

  const tool =
    normalizedText(
      context.tool
    )

  const eventText =
    recentEventText(
      context.recentEvents
    )

  let mediaScore = 0
  let socialScore = 0

  const mediaEvidence = []
  const socialEvidence = []

  if (
    containsAny(
      page,
      [
        "gallery",
        "media",
        "video",
        "image",
      ]
    )
  ) {
    mediaScore += 0.45
    mediaEvidence.push("page")
  }

  if (
    containsAny(
      route,
      [
        "gallery",
        "media",
      ]
    )
  ) {
    mediaScore += 0.2
    mediaEvidence.push("route")
  }

  if (
    containsAny(
      tool,
      [
        "media",
        "video",
        "image",
      ]
    )
  ) {
    mediaScore += 0.25
    mediaEvidence.push("tool")
  }

  if (
    containsAny(
      page,
      [
        "instagram",
        "social",
        "marketing",
      ]
    )
  ) {
    socialScore += 0.5
    socialEvidence.push("page")
  }

  if (
    containsAny(
      eventText,
      [
        "instagram",
        "social",
        "publish",
        "post",
      ]
    )
  ) {
    socialScore += 0.3
    socialEvidence.push("recentEvents")
  }

  if (
    mediaScore > 0
  ) {
    candidates.push(
      createCandidate({
        type:
          INTENT_TYPES.EDIT_MEDIA,

        score:
          clampNumber(
            mediaScore,
            0,
            1
          ),

        reason:
          "Current context indicates image or video work.",

        evidence:
          mediaEvidence,
      })
    )
  }

  if (
    socialScore > 0
  ) {
    candidates.push(
      createCandidate({
        type:
          INTENT_TYPES.PREPARE_SOCIAL,

        score:
          clampNumber(
            socialScore,
            0,
            1
          ),

        reason:
          "Current context indicates social media preparation.",

        evidence:
          socialEvidence,
      })
    )
  }
}


/**
 * Asiakastyö.
 */
function evaluateCustomerIntent(
  context,
  candidates
) {
  const page =
    normalizedText(
      context.page
    )

  const route =
    normalizedText(
      context.route
    )

  let score = 0

  const evidence = []

  if (
    context.customer
  ) {
    score += 0.25
    evidence.push(
      "activeCustomer"
    )
  }

  if (
    containsAny(
      page,
      [
        "customer",
        "asiakas",
      ]
    )
  ) {
    score += 0.5
    evidence.push("page")
  }

  if (
    containsAny(
      route,
      [
        "customer",
      ]
    )
  ) {
    score += 0.25
    evidence.push("route")
  }

  if (score > 0.4) {
    candidates.push(
      createCandidate({
        type:
          INTENT_TYPES.MANAGE_CUSTOMER,

        score:
          clampNumber(
            score,
            0,
            1
          ),

        reason:
          "Current context indicates customer-related work.",

        evidence,
      })
    )
  }
}


/**
 * Knowledge / search / documentation.
 */
function evaluateKnowledgeIntent(
  context,
  candidates
) {
  const page =
    normalizedText(
      context.page
    )

  const route =
    normalizedText(
      context.route
    )

  const tool =
    normalizedText(
      context.tool
    )

  let searchScore = 0
  let documentationScore = 0

  const searchEvidence = []
  const documentationEvidence = []

  if (
    containsAny(
      page,
      [
        "knowledge",
        "search",
        "library",
      ]
    )
  ) {
    searchScore += 0.5
    searchEvidence.push("page")
  }

  if (
    containsAny(
      tool,
      [
        "search",
        "knowledge",
      ]
    )
  ) {
    searchScore += 0.35
    searchEvidence.push("tool")
  }

  if (
    containsAny(
      page,
      [
        "notes",
        "documentation",
        "timeline",
      ]
    )
  ) {
    documentationScore += 0.5
    documentationEvidence.push("page")
  }

  if (
    containsAny(
      route,
      [
        "notes",
        "timeline",
      ]
    )
  ) {
    documentationScore += 0.25
    documentationEvidence.push("route")
  }

  if (searchScore > 0) {
    candidates.push(
      createCandidate({
        type:
          INTENT_TYPES.FIND_INFORMATION,

        score:
          clampNumber(
            searchScore,
            0,
            1
          ),

        reason:
          "Current context indicates information retrieval.",

        evidence:
          searchEvidence,
      })
    )
  }

  if (
    documentationScore > 0
  ) {
    candidates.push(
      createCandidate({
        type:
          INTENT_TYPES.DOCUMENT_WORK,

        score:
          clampNumber(
            documentationScore,
            0,
            1
          ),

        reason:
          "Current context indicates documentation work.",

        evidence:
          documentationEvidence,
      })
    )
  }
}


/**
 * Projektiin liittyvä intent.
 */
function evaluateProjectIntent(
  context,
  candidates
) {
  if (!context.project) {
    return
  }

  const page =
    normalizedText(
      context.page
    )

  const route =
    normalizedText(
      context.route
    )

  let score = 0.4

  const evidence = [
    "activeProject",
  ]

  if (
    containsAny(
      page,
      [
        "project",
        "projectdetails",
      ]
    )
  ) {
    score += 0.3
    evidence.push("page")
  }

  if (
    containsAny(
      route,
      [
        "/projects/",
      ]
    )
  ) {
    score += 0.2
    evidence.push("route")
  }

  candidates.push(
    createCandidate({
      type:
        score >= 0.7
          ? INTENT_TYPES.EDIT_PROJECT
          : INTENT_TYPES.VIEW_PROJECT,

      score:
        clampNumber(
          score,
          0,
          1
        ),

      reason:
        "An active project is currently in context.",

      evidence,
    })
  )
}


/**
 * Työtehtävä / workflow.
 */
function evaluateTaskIntent(
  context,
  candidates
) {
  const task =
    context.task

  const workflow =
    context.workflow

  if (!task && !workflow) {
    return
  }

  const evidence = []

  let score = 0.4

  if (task) {
    score += 0.25
    evidence.push("activeTask")
  }

  if (workflow) {
    score += 0.2
    evidence.push(
      "activeWorkflow"
    )
  }

  candidates.push(
    createCandidate({
      type:
        INTENT_TYPES.COMPLETE_TASK,

      score:
        clampNumber(
          score,
          0,
          1
        ),

      reason:
        "Current context contains an active task or workflow.",

      evidence,
    })
  )
}


/**
 * Focus Enginen nykyinen fokus.
 */
function evaluateGeneralFocusIntent(
  context,
  candidates
) {
  const primaryFocus =
    context?.focus
      ?.primaryFocus

  if (!primaryFocus) {
    return
  }

  candidates.push(
    createCandidate({
      type:
        INTENT_TYPES.CONTINUE_WORK,

      score: 0.65,

      reason:
        "Focus Engine has an active primary focus.",

      evidence: [
        "focus.primaryFocus",
      ],

      metadata: {
        focusId:
          primaryFocus.id ??
          null,

        focusTitle:
          primaryFocus.title ??
          null,
      },
    })
  )
}


/**
 * Pakotettu intent käyttäjän tai
 * ylemmän järjestelmän päätöksellä.
 *
 * Esimerkiksi jos käyttäjä sanoo:
 *
 * "Haluan tehdä tarjouksen."
 *
 * Tämä saa korkean confidence-tason.
 */
function setExplicitIntent({
  type,
  reason = null,
  source = "user",
  metadata = null,
} = {}) {
  ensureInitialized()

  const safeType =
    normalizeIntentType(type)

  const intent =
    createCandidate({
      type:
        safeType,

      score:
        source === "user"
          ? 1
          : 0.95,

      reason:
        sanitizeString(reason) ||
        "Explicit intent provided.",

      evidence: [
        `explicit:${sanitizeString(source) || "unknown"}`,
      ],

      metadata,
    })

  updateCurrentIntent(intent)

  touch()

  return {
    success: true,
    intent:
      clone(
        state.currentIntent
      ),
  }
}


/**
 * Tyhjentää nykyisen intentin.
 */
function clearIntent() {
  ensureInitialized()

  if (state.currentIntent) {
    addIntentHistory({
      action:
        "intent-cleared",

      previous:
        clone(
          state.currentIntent
        ),
    })
  }

  state.currentIntent = null
  state.candidates = []

  touch()

  return {
    success: true,
    status: "cleared",
  }
}


/**
 * Palauttaa nykyisen intentin.
 */
function getCurrentIntent() {
  ensureInitialized()

  return state.currentIntent
    ? clone(
        state.currentIntent
      )
    : null
}


/**
 * Palauttaa pienen AI-contextin.
 */
function getIntentContext() {
  ensureInitialized()

  return clone({
    currentIntent:
      state.currentIntent,

    alternatives:
      state.candidates
        .slice(1, 4),

    guidance:
      buildIntentGuidance(),
  })
}


/**
 * Historia.
 */
function getIntentHistory(
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
 * Yhteenveto.
 */
function getIntentSummary() {
  ensureInitialized()

  return {
    currentIntent:
      clone(
        state.currentIntent
      ),

    candidates:
      state.candidates.length,

    counters:
      clone(
        state.counters
      ),

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Health check.
 */
function getBoosterverseIntentEngineHealth() {
  return {
    moduleId:
      MODULE_ID,

    version:
      MODULE_VERSION,

    healthy: true,

    status:
      state.initialized
        ? "running"
        : "idle",

    metrics: {
      evaluations:
        state.counters
          .evaluations,

      intentChanges:
        state.counters
          .intentChanges,

      unknownResults:
        state.counters
          .unknownResults,

      history:
        state.history.length,
    },

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Päivittää nykyisen intentin.
 */
function updateCurrentIntent(
  candidate
) {
  const now =
    new Date().toISOString()

  const next = {
    id:
      createId("bv-intent"),

    type:
      normalizeIntentType(
        candidate.type
      ),

    confidence:
      clampNumber(
        candidate.score,
        0,
        1
      ),

    reason:
      sanitizeString(
        candidate.reason
      ),

    evidence:
      normalizeStrings(
        candidate.evidence
      ),

    metadata:
      candidate.metadata ??
      null,

    inferred:
      candidate.type !==
      INTENT_TYPES.UNKNOWN,

    updatedAt:
      now,
  }

  const previousType =
    state.currentIntent
      ?.type

  if (
    previousType !==
    next.type
  ) {
    state.counters
      .intentChanges += 1
  }

  if (
    next.type ===
    INTENT_TYPES.UNKNOWN
  ) {
    state.counters
      .unknownResults += 1
  }

  state.currentIntent = next

  addIntentHistory({
    action:
      "intent-evaluated",

    intent:
      clone(next),
  })
}


/**
 * Rakentaa läpinäkyvän ohjauksen.
 */
function buildIntentGuidance() {
  if (!state.currentIntent) {
    return {
      type:
        "no-intent",

      message:
        "No current intent has been identified.",
    }
  }

  if (
    state.currentIntent
      .confidence >= 0.8
  ) {
    return {
      type:
        "strong-intent",

      message:
        "Intent confidence is high enough for contextual assistance.",
    }
  }

  if (
    state.currentIntent
      .confidence >= 0.5
  ) {
    return {
      type:
        "probable-intent",

      message:
        "Intent is probable but should not be treated as certain.",
    }
  }

  return {
    type:
      "weak-intent",

    message:
      "Intent confidence is low. Avoid autonomous action.",
  }
}


function createCandidate({
  type,
  score,
  reason,
  evidence = [],
  metadata = null,
}) {
  return {
    type:
      normalizeIntentType(
        type
      ),

    score:
      clampNumber(
        score,
        0,
        1
      ),

    reason:
      sanitizeString(
        reason
      ),

    evidence:
      normalizeStrings(
        evidence
      ),

    metadata,
  }
}


function createUnknownIntent() {
  return createCandidate({
    type:
      INTENT_TYPES.UNKNOWN,

    score: 0,

    reason:
      "Current context does not provide enough evidence for a useful intent estimate.",

    evidence: [],
  })
}


function recentEventText(
  events
) {
  if (!Array.isArray(events)) {
    return ""
  }

  return events
    .slice(-10)
    .map(
      (event) =>
        [
          event?.type,
          event?.message,
          event?.entity?.type,
        ]
          .filter(Boolean)
          .join(" ")
    )
    .join(" ")
    .toLowerCase()
}


function containsAny(
  value,
  words
) {
  if (!value) {
    return false
  }

  return words.some(
    (word) =>
      value.includes(
        String(word)
          .toLowerCase()
      )
  )
}


function normalizedText(
  value
) {
  return (
    sanitizeString(value)
      ?.toLowerCase() || ""
  )
}


function normalizeIntentType(
  type
) {
  const safe =
    sanitizeString(type)

  const values =
    Object.values(
      INTENT_TYPES
    )

  return values.includes(safe)
    ? safe
    : INTENT_TYPES.UNKNOWN
}


function normalizeStrings(
  values
) {
  const array =
    Array.isArray(values)
      ? values
      : [values]

  return [
    ...new Set(
      array
        .map(sanitizeString)
        .filter(Boolean)
    ),
  ]
}


function addIntentHistory(
  entry
) {
  state.history.push({
    ...entry,

    timestamp:
      new Date().toISOString(),
  })

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
    initializeBoosterverseIntentEngine()
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
  INTENT_TYPES,

  initializeBoosterverseIntentEngine,

  evaluateIntent,

  setExplicitIntent,

  clearIntent,

  getCurrentIntent,

  getIntentContext,

  getIntentHistory,

  getIntentSummary,

  getBoosterverseIntentEngineHealth,
}


export default {
  id: MODULE_ID,

  name:
    "Boosterverse Intent Engine",

  version:
    MODULE_VERSION,

  description:
    "Boosterversen läpinäkyvä käyttäjän tämänhetkisen tavoitteen arviointi- ja intent-kerros.",

  initialize:
    initializeBoosterverseIntentEngine,

  evaluateIntent,

  setExplicitIntent,

  clearIntent,

  getCurrentIntent,

  getIntentContext,

  getIntentHistory,

  getIntentSummary,

  health:
    getBoosterverseIntentEngineHealth,
}
