/**
 * Wood-Booster OS
 * Boosterverse Reflection Engine
 *
 * Tarkoitus:
 * - tarkastella tapahtumia ja kokemuksia
 * - muodostaa reflektoituja havaintoja
 * - erottaa onnistumiset, ongelmat ja opit
 * - tuottaa ehdotuksia myöhemmälle Wisdom Enginelle
 *
 * Tämä moduuli EI:
 * - kutsu LLM:ää
 * - muuta Canon-tietoa
 * - tee automaatioita
 * - päätä käyttäjän puolesta
 * - tee havainnoista faktoja
 */

const MODULE_ID = "boosterverse-reflection-engine"
const MODULE_VERSION = "1.0.0"

const REFLECTION_TYPES = Object.freeze({
  SUCCESS: "success",
  FAILURE: "failure",
  LESSON: "lesson",
  PATTERN: "pattern",
  QUESTION: "question",
  OPPORTUNITY: "opportunity",
  WARNING: "warning",
  NEUTRAL: "neutral",
})

const state = {
  initialized: false,
  startedAt: null,
  updatedAt: null,

  reflections: new Map(),

  counters: {
    reflectionsCreated: 0,
    successes: 0,
    failures: 0,
    lessons: 0,
    patterns: 0,
    opportunities: 0,
    warnings: 0,
  },
}


/**
 * Alustaa Reflection Enginen.
 */
function initializeBoosterverseReflectionEngine() {
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
 * Luo reflection-merkinnän.
 *
 * Reflection ei ole vielä pysyvää tietoa.
 * Se on turvallinen välivaihe tapahtuman ja oppimisen välillä.
 */
function createReflection({
  id = null,
  type = REFLECTION_TYPES.NEUTRAL,

  title = null,
  summary = null,
  lesson = null,

  sourceEventIds = [],
  sourceKnowledgeIds = [],

  entityType = null,
  entityId = null,

  confidence = 0.5,
  importance = 0.5,

  evidence = [],
  tags = [],

  metadata = null,
} = {}) {
  ensureInitialized()

  const reflectionId =
    sanitizeString(id) ||
    createId("bv-reflection")

  if (state.reflections.has(reflectionId)) {
    return {
      success: false,
      error: `Reflection already exists: ${reflectionId}`,
    }
  }

  const safeType = normalizeReflectionType(type)

  const now = new Date().toISOString()

  const reflection = {
    id: reflectionId,

    type: safeType,

    title: sanitizeString(title),
    summary: sanitizeString(summary),
    lesson: sanitizeString(lesson),

    entity: {
      type: sanitizeString(entityType),
      id: sanitizeString(entityId),
    },

    sources: {
      eventIds: normalizeIds(sourceEventIds),
      knowledgeIds: normalizeIds(sourceKnowledgeIds),
    },

    confidence: clampNumber(
      confidence,
      0,
      1
    ),

    importance: clampNumber(
      importance,
      0,
      1
    ),

    evidence: normalizeEvidence(evidence),

    tags: normalizeTags(tags),

    metadata,

    status: "open",

    reviewedByUser: false,
    acceptedAsLesson: false,

    createdAt: now,
    updatedAt: now,
  }

  state.reflections.set(
    reflectionId,
    reflection
  )

  state.counters.reflectionsCreated += 1

  incrementTypeCounter(safeType)

  touch()

  return {
    success: true,
    reflection: clone(reflection),
  }
}


/**
 * Luo yksinkertaisen reflektion tapahtumasta.
 *
 * Tätä voidaan myöhemmin käyttää
 * Event Enginen kanssa.
 */
function reflectOnEvent(
  event,
  {
    type = null,
    summary = null,
    lesson = null,
    confidence = null,
    importance = null,
    tags = [],
  } = {}
) {
  ensureInitialized()

  if (
    !event ||
    typeof event !== "object"
  ) {
    return {
      success: false,
      error: "Valid event is required",
    }
  }

  const inferredType =
    type ||
    inferReflectionTypeFromEvent(
      event
    )

  return createReflection({
    type: inferredType,

    title:
      event.message ||
      event.type ||
      "Boosterverse event",

    summary:
      summary ||
      event.message ||
      null,

    lesson,

    sourceEventIds:
      event.id
        ? [event.id]
        : [],

    entityType:
      event.entity?.type ??
      null,

    entityId:
      event.entity?.id ??
      null,

    confidence:
      confidence ??
      event.confidence ??
      0.5,

    importance:
      importance ??
      event.importance ??
      0.5,

    tags: [
      ...(Array.isArray(event.tags)
        ? event.tags
        : []),
      ...tags,
    ],
  })
}


/**
 * Hakee reflectionin.
 */
function getReflection(id) {
  ensureInitialized()

  const reflection =
    state.reflections.get(
      sanitizeString(id)
    )

  return reflection
    ? clone(reflection)
    : null
}


/**
 * Listaa reflectionit.
 */
function listReflections({
  type = null,
  status = "open",
  entityType = null,
  entityId = null,
  minConfidence = 0,
  minImportance = 0,
  limit = 100,
} = {}) {
  ensureInitialized()

  const safeType =
    type
      ? normalizeReflectionType(type)
      : null

  return [
    ...state.reflections.values(),
  ]
    .filter((reflection) => {
      if (
        safeType &&
        reflection.type !== safeType
      ) {
        return false
      }

      if (
        status &&
        reflection.status !== status
      ) {
        return false
      }

      if (
        entityType &&
        reflection.entity.type !==
          entityType
      ) {
        return false
      }

      if (
        entityId &&
        reflection.entity.id !==
          entityId
      ) {
        return false
      }

      if (
        reflection.confidence <
        clampNumber(
          minConfidence,
          0,
          1
        )
      ) {
        return false
      }

      if (
        reflection.importance <
        clampNumber(
          minImportance,
          0,
          1
        )
      ) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      const scoreA =
        a.importance *
        a.confidence

      const scoreB =
        b.importance *
        b.confidence

      if (scoreB !== scoreA) {
        return scoreB - scoreA
      }

      return (
        new Date(
          b.updatedAt
        ).getTime() -
        new Date(
          a.updatedAt
        ).getTime()
      )
    })
    .slice(
      0,
      Math.max(
        1,
        Number(limit) || 100
      )
    )
    .map(clone)
}


/**
 * Käyttäjä tarkistaa reflectionin.
 */
function reviewReflection(
  reflectionId,
  {
    accepted = false,
    lesson = null,
    note = null,
  } = {}
) {
  ensureInitialized()

  const reflection =
    state.reflections.get(
      sanitizeString(
        reflectionId
      )
    )

  if (!reflection) {
    return {
      success: false,
      error: "Reflection not found",
    }
  }

  reflection.reviewedByUser = true

  reflection.acceptedAsLesson =
    Boolean(accepted)

  if (lesson !== null) {
    reflection.lesson =
      sanitizeString(lesson)
  }

  reflection.reviewNote =
    sanitizeString(note)

  reflection.status =
    accepted
      ? "accepted"
      : "reviewed"

  reflection.updatedAt =
    new Date().toISOString()

  touch()

  return {
    success: true,
    reflection: clone(reflection),
  }
}


/**
 * Sulkee reflectionin ilman oppia.
 */
function dismissReflection(
  reflectionId,
  reason = null
) {
  ensureInitialized()

  const reflection =
    state.reflections.get(
      sanitizeString(
        reflectionId
      )
    )

  if (!reflection) {
    return {
      success: false,
      error: "Reflection not found",
    }
  }

  reflection.status = "dismissed"

  reflection.dismissReason =
    sanitizeString(reason)

  reflection.updatedAt =
    new Date().toISOString()

  touch()

  return {
    success: true,
    reflection: clone(reflection),
  }
}


/**
 * Palauttaa hyväksytyt opit.
 *
 * Näitä voidaan myöhemmin syöttää
 * Wisdom Engineen tai Canon Engineen
 * hallitun prosessin kautta.
 */
function getAcceptedLessons(
  limit = 100
) {
  ensureInitialized()

  return [
    ...state.reflections.values(),
  ]
    .filter(
      (reflection) =>
        reflection
          .acceptedAsLesson === true
    )
    .sort(
      (a, b) =>
        new Date(
          b.updatedAt
        ).getTime() -
        new Date(
          a.updatedAt
        ).getTime()
    )
    .slice(
      0,
      Math.max(
        1,
        Number(limit) || 100
      )
    )
    .map(clone)
}


/**
 * Tunnistaa yksinkertaisia toistuvia
 * reflection-tyyppejä.
 *
 * Tämä EI vielä tee älykästä päättelyä.
 */
function findRepeatedPatterns({
  entityType = null,
  entityId = null,
  minOccurrences = 3,
} = {}) {
  ensureInitialized()

  const groups = new Map()

  for (
    const reflection
    of state.reflections.values()
  ) {
    if (
      reflection.status ===
      "dismissed"
    ) {
      continue
    }

    if (
      entityType &&
      reflection.entity.type !==
        entityType
    ) {
      continue
    }

    if (
      entityId &&
      reflection.entity.id !==
        entityId
    ) {
      continue
    }

    const key = [
      reflection.type,
      reflection.entity.type || "none",
      reflection.title || "untitled",
    ].join("::")

    if (!groups.has(key)) {
      groups.set(key, [])
    }

    groups
      .get(key)
      .push(reflection)
  }

  const threshold =
    Math.max(
      2,
      Number(
        minOccurrences
      ) || 3
    )

  return [
    ...groups.entries(),
  ]
    .filter(
      ([, items]) =>
        items.length >= threshold
    )
    .map(
      ([key, items]) => ({
        key,
        count: items.length,

        type:
          items[0].type,

        entity:
          clone(
            items[0].entity
          ),

        title:
          items[0].title,

        averageConfidence:
          average(
            items.map(
              (item) =>
                item.confidence
            )
          ),

        averageImportance:
          average(
            items.map(
              (item) =>
                item.importance
            )
          ),

        reflectionIds:
          items.map(
            (item) =>
              item.id
          ),
      })
    )
    .sort(
      (a, b) =>
        b.count - a.count
    )
}


/**
 * Kevyt Reflection Summary.
 */
function getReflectionSummary() {
  ensureInitialized()

  const statuses = {}

  for (
    const reflection
    of state.reflections.values()
  ) {
    statuses[
      reflection.status
    ] =
      (statuses[
        reflection.status
      ] || 0) + 1
  }

  return {
    total:
      state.reflections.size,

    statuses,

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
function getBoosterverseReflectionEngineHealth() {
  return {
    moduleId: MODULE_ID,
    version: MODULE_VERSION,

    healthy: true,

    status:
      state.initialized
        ? "running"
        : "idle",

    metrics:
      getReflectionSummary(),
  }
}


/**
 * Runtime-reflectionien tyhjennys testeihin.
 */
function clearRuntimeReflections() {
  ensureInitialized()

  state.reflections.clear()

  state.updatedAt =
    new Date().toISOString()

  return {
    success: true,
    status: "cleared",
  }
}


/**
 * Yksinkertainen event -> reflection type.
 *
 * Myöhemmin tämän päälle voidaan
 * rakentaa älykkäämpi analyysi.
 */
function inferReflectionTypeFromEvent(
  event
) {
  const type =
    sanitizeString(
      event.type
    )?.toLowerCase() || ""

  if (
    type.includes("completed") ||
    type.includes("success") ||
    type.includes("finished")
  ) {
    return REFLECTION_TYPES.SUCCESS
  }

  if (
    type.includes("failed") ||
    type.includes("error")
  ) {
    return REFLECTION_TYPES.FAILURE
  }

  if (
    type.includes("warning")
  ) {
    return REFLECTION_TYPES.WARNING
  }

  return REFLECTION_TYPES.NEUTRAL
}


function incrementTypeCounter(type) {
  switch (type) {
    case REFLECTION_TYPES.SUCCESS:
      state.counters.successes += 1
      break

    case REFLECTION_TYPES.FAILURE:
      state.counters.failures += 1
      break

    case REFLECTION_TYPES.LESSON:
      state.counters.lessons += 1
      break

    case REFLECTION_TYPES.PATTERN:
      state.counters.patterns += 1
      break

    case REFLECTION_TYPES.OPPORTUNITY:
      state.counters.opportunities += 1
      break

    case REFLECTION_TYPES.WARNING:
      state.counters.warnings += 1
      break

    default:
      break
  }
}


function normalizeReflectionType(type) {
  const safe =
    sanitizeString(type)

  const values =
    Object.values(
      REFLECTION_TYPES
    )

  return values.includes(safe)
    ? safe
    : REFLECTION_TYPES.NEUTRAL
}


function normalizeIds(ids) {
  if (!Array.isArray(ids)) {
    return []
  }

  return [
    ...new Set(
      ids
        .map(sanitizeString)
        .filter(Boolean)
    ),
  ]
}


function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return []
  }

  return [
    ...new Set(
      tags
        .map(sanitizeString)
        .filter(Boolean)
    ),
  ]
}


function normalizeEvidence(evidence) {
  if (!Array.isArray(evidence)) {
    return []
  }

  return evidence
    .filter(
      (item) =>
        item &&
        typeof item === "object"
    )
    .map(
      (item) => ({
        id:
          item.id ??
          createId(
            "bv-reflection-evidence"
          ),

        source:
          sanitizeString(
            item.source
          ),

        description:
          sanitizeString(
            item.description
          ),

        confidence:
          clampNumber(
            item.confidence ?? 1,
            0,
            1
          ),

        createdAt:
          item.createdAt ??
          new Date().toISOString(),
      })
    )
}


function average(values) {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return 0
  }

  return (
    values.reduce(
      (sum, value) =>
        sum +
        clampNumber(
          value,
          0,
          1
        ),
      0
    ) / values.length
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
    initializeBoosterverseReflectionEngine()
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
  REFLECTION_TYPES,

  initializeBoosterverseReflectionEngine,

  createReflection,

  reflectOnEvent,

  getReflection,

  listReflections,

  reviewReflection,

  dismissReflection,

  getAcceptedLessons,

  findRepeatedPatterns,

  getReflectionSummary,

  getBoosterverseReflectionEngineHealth,

  clearRuntimeReflections,
}


export default {
  id: MODULE_ID,

  name:
    "Boosterverse Reflection Engine",

  version:
    MODULE_VERSION,

  description:
    "Boosterversen turvallinen reflektio-, kokemus- ja oppimishavaintojen kerros.",

  initialize:
    initializeBoosterverseReflectionEngine,

  createReflection,

  reflectOnEvent,

  getReflection,

  listReflections,

  reviewReflection,

  dismissReflection,

  getAcceptedLessons,

  findRepeatedPatterns,

  getReflectionSummary,

  health:
    getBoosterverseReflectionEngineHealth,
}
