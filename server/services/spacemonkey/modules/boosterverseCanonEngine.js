/**
 * Wood-Booster OS
 * Boosterverse Canon Engine
 *
 * Tarkoitus:
 * - erottaa idea, havainto, kokemus, varmennettu tieto ja canon
 * - estää Spacemonkeyta kohtelemasta kaikkea muistia faktana
 * - ylläpitää tiedon luottamustasoa
 * - mahdollistaa canon candidate -> user approval -> canon
 *
 * Tämä moduuli EI:
 * - kutsu LLM:ää
 * - muuta projektidataa
 * - tee automaatioita
 * - hyväksy canon-tietoa itse
 */

const MODULE_ID = "boosterverse-canon-engine"
const MODULE_VERSION = "1.0.0"

const KNOWLEDGE_LEVELS = Object.freeze({
  IDEA: "idea",
  OBSERVATION: "observation",
  EXPERIENCE: "experience",
  VERIFIED: "verified",
  CANON_CANDIDATE: "canon_candidate",
  CANON: "canon",
})

const DEFAULT_TRUST = Object.freeze({
  idea: 0.2,
  observation: 0.5,
  experience: 0.7,
  verified: 0.9,
  canon_candidate: 0.95,
  canon: 1,
})

const store = {
  initialized: false,
  startedAt: null,
  updatedAt: null,

  entries: new Map(),

  counters: {
    created: 0,
    promoted: 0,
    demoted: 0,
    canonApproved: 0,
    rejected: 0,
  },
}


function initializeBoosterverseCanonEngine() {
  if (store.initialized) {
    return {
      success: true,
      status: "already-initialized",
      moduleId: MODULE_ID,
    }
  }

  const now = new Date().toISOString()

  store.initialized = true
  store.startedAt = now
  store.updatedAt = now

  return {
    success: true,
    status: "initialized",
    moduleId: MODULE_ID,
    version: MODULE_VERSION,
  }
}


function createKnowledgeEntry({
  id = null,
  title = null,
  content = null,
  level = KNOWLEDGE_LEVELS.IDEA,
  source = "unknown",
  sourceId = null,
  entityType = null,
  entityId = null,
  trust = null,
  evidence = [],
  tags = [],
  metadata = null,
} = {}) {
  ensureInitialized()

  const safeLevel = normalizeLevel(level)

  const entryId =
    sanitizeString(id) ||
    `bv-knowledge-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`

  if (store.entries.has(entryId)) {
    return {
      success: false,
      error: `Knowledge entry already exists: ${entryId}`,
    }
  }

  const now = new Date().toISOString()

  const entry = {
    id: entryId,

    title: sanitizeString(title),
    content: sanitizeString(content),

    level: safeLevel,

    trust:
      trust === null
        ? DEFAULT_TRUST[safeLevel]
        : clampNumber(trust, 0, 1),

    source: sanitizeString(source),
    sourceId: sanitizeString(sourceId),

    entity: {
      type: sanitizeString(entityType),
      id: sanitizeString(entityId),
    },

    evidence: normalizeEvidence(evidence),

    tags: normalizeTags(tags),

    metadata,

    status: "active",

    history: [
      {
        action: "created",
        level: safeLevel,
        timestamp: now,
      },
    ],

    createdAt: now,
    updatedAt: now,
  }

  store.entries.set(entryId, entry)

  store.counters.created += 1

  touch()

  return {
    success: true,
    entry: clone(entry),
  }
}


function getKnowledgeEntry(id) {
  ensureInitialized()

  const entry = store.entries.get(
    sanitizeString(id)
  )

  return entry
    ? clone(entry)
    : null
}


function listKnowledge({
  level = null,
  entityType = null,
  entityId = null,
  minTrust = 0,
  limit = 100,
} = {}) {
  ensureInitialized()

  const safeLevel =
    level === null
      ? null
      : normalizeLevel(level)

  return [...store.entries.values()]
    .filter((entry) => {
      if (
        safeLevel &&
        entry.level !== safeLevel
      ) {
        return false
      }

      if (
        entityType &&
        entry.entity.type !== entityType
      ) {
        return false
      }

      if (
        entityId &&
        entry.entity.id !== entityId
      ) {
        return false
      }

      if (
        entry.trust <
        clampNumber(minTrust, 0, 1)
      ) {
        return false
      }

      return entry.status === "active"
    })
    .sort((a, b) => {
      if (b.trust !== a.trust) {
        return b.trust - a.trust
      }

      return (
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
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


function addEvidence(
  entryId,
  {
    type = "reference",
    source = "unknown",
    sourceId = null,
    description = null,
    confidence = 1,
  } = {}
) {
  ensureInitialized()

  const entry = store.entries.get(
    sanitizeString(entryId)
  )

  if (!entry) {
    return {
      success: false,
      error: "Knowledge entry not found",
    }
  }

  const evidence = {
    id: `bv-evidence-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,

    type: sanitizeString(type),
    source: sanitizeString(source),
    sourceId: sanitizeString(sourceId),

    description:
      sanitizeString(description),

    confidence:
      clampNumber(confidence, 0, 1),

    createdAt:
      new Date().toISOString(),
  }

  entry.evidence.push(evidence)

  entry.updatedAt =
    new Date().toISOString()

  recalculateTrust(entry)

  touch()

  return {
    success: true,
    evidence: clone(evidence),
    entry: clone(entry),
  }
}


function promoteKnowledge(
  entryId,
  targetLevel,
  {
    reason = null,
    approvedByUser = false,
  } = {}
) {
  ensureInitialized()

  const entry = store.entries.get(
    sanitizeString(entryId)
  )

  if (!entry) {
    return {
      success: false,
      error: "Knowledge entry not found",
    }
  }

  const safeTarget =
    normalizeLevel(targetLevel)

  const currentIndex =
    getLevelIndex(entry.level)

  const targetIndex =
    getLevelIndex(safeTarget)

  if (targetIndex <= currentIndex) {
    return {
      success: false,
      error:
        "Target level must be higher than current level",
    }
  }

  if (
    safeTarget === KNOWLEDGE_LEVELS.CANON &&
    !approvedByUser
  ) {
    return {
      success: false,
      error:
        "Canon promotion requires explicit user approval",
    }
  }

  const previousLevel = entry.level

  entry.level = safeTarget

  entry.trust = Math.max(
    entry.trust,
    DEFAULT_TRUST[safeTarget]
  )

  entry.updatedAt =
    new Date().toISOString()

  entry.history.push({
    action: "promoted",
    from: previousLevel,
    to: safeTarget,
    reason: sanitizeString(reason),
    approvedByUser:
      Boolean(approvedByUser),
    timestamp:
      new Date().toISOString(),
  })

  store.counters.promoted += 1

  if (
    safeTarget ===
    KNOWLEDGE_LEVELS.CANON
  ) {
    store.counters.canonApproved += 1
  }

  touch()

  return {
    success: true,
    entry: clone(entry),
  }
}


function demoteKnowledge(
  entryId,
  targetLevel,
  reason = null
) {
  ensureInitialized()

  const entry = store.entries.get(
    sanitizeString(entryId)
  )

  if (!entry) {
    return {
      success: false,
      error: "Knowledge entry not found",
    }
  }

  if (
    entry.level === KNOWLEDGE_LEVELS.CANON
  ) {
    return {
      success: false,
      error:
        "Canon cannot be demoted through normal runtime logic",
    }
  }

  const safeTarget =
    normalizeLevel(targetLevel)

  const currentIndex =
    getLevelIndex(entry.level)

  const targetIndex =
    getLevelIndex(safeTarget)

  if (targetIndex >= currentIndex) {
    return {
      success: false,
      error:
        "Target level must be lower than current level",
    }
  }

  const previousLevel = entry.level

  entry.level = safeTarget

  entry.trust = Math.min(
    entry.trust,
    DEFAULT_TRUST[safeTarget]
  )

  entry.updatedAt =
    new Date().toISOString()

  entry.history.push({
    action: "demoted",
    from: previousLevel,
    to: safeTarget,
    reason: sanitizeString(reason),
    timestamp:
      new Date().toISOString(),
  })

  store.counters.demoted += 1

  touch()

  return {
    success: true,
    entry: clone(entry),
  }
}


function rejectKnowledge(
  entryId,
  reason = null
) {
  ensureInitialized()

  const entry = store.entries.get(
    sanitizeString(entryId)
  )

  if (!entry) {
    return {
      success: false,
      error: "Knowledge entry not found",
    }
  }

  if (
    entry.level === KNOWLEDGE_LEVELS.CANON
  ) {
    return {
      success: false,
      error:
        "Canon cannot be rejected through normal runtime logic",
    }
  }

  entry.status = "rejected"
  entry.updatedAt =
    new Date().toISOString()

  entry.history.push({
    action: "rejected",
    reason: sanitizeString(reason),
    timestamp:
      new Date().toISOString(),
  })

  store.counters.rejected += 1

  touch()

  return {
    success: true,
    entry: clone(entry),
  }
}


function createCanonCandidate(
  entryId,
  reason = null
) {
  return promoteKnowledge(
    entryId,
    KNOWLEDGE_LEVELS.CANON_CANDIDATE,
    {
      reason,
      approvedByUser: false,
    }
  )
}


function approveCanon(
  entryId,
  reason = null
) {
  return promoteKnowledge(
    entryId,
    KNOWLEDGE_LEVELS.CANON,
    {
      reason,
      approvedByUser: true,
    }
  )
}


function getCanon() {
  return listKnowledge({
    level:
      KNOWLEDGE_LEVELS.CANON,
    minTrust: 0,
    limit: 10000,
  })
}


function getCanonCandidates() {
  return listKnowledge({
    level:
      KNOWLEDGE_LEVELS.CANON_CANDIDATE,
    minTrust: 0,
    limit: 1000,
  })
}


function getTruthSummary() {
  ensureInitialized()

  const levels = {}

  for (
    const level
    of Object.values(KNOWLEDGE_LEVELS)
  ) {
    levels[level] = 0
  }

  for (const entry of store.entries.values()) {
    if (entry.status !== "active") {
      continue
    }

    levels[entry.level] += 1
  }

  return {
    totalEntries:
      store.entries.size,

    levels,

    counters:
      clone(store.counters),

    updatedAt:
      store.updatedAt,
  }
}


function getBoosterverseCanonEngineHealth() {
  return {
    moduleId: MODULE_ID,
    version: MODULE_VERSION,

    healthy: true,

    status:
      store.initialized
        ? "running"
        : "idle",

    metrics: getTruthSummary(),
  }
}


function clearRuntimeKnowledge() {
  ensureInitialized()

  store.entries.clear()

  store.updatedAt =
    new Date().toISOString()

  return {
    success: true,
    status: "cleared",
  }
}


function recalculateTrust(entry) {
  const base =
    DEFAULT_TRUST[entry.level] ?? 0.5

  if (
    !Array.isArray(entry.evidence) ||
    entry.evidence.length === 0
  ) {
    entry.trust = base
    return
  }

  const evidenceAverage =
    entry.evidence.reduce(
      (sum, item) =>
        sum +
        clampNumber(
          item.confidence,
          0,
          1
        ),
      0
    ) / entry.evidence.length

  entry.trust =
    clampNumber(
      base * 0.6 +
        evidenceAverage * 0.4,
      0,
      1
    )
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
    .map((item) => ({
      id:
        item.id ??
        `bv-evidence-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        sanitizeString(item.type) ||
        "reference",

      source:
        sanitizeString(item.source),

      sourceId:
        sanitizeString(
          item.sourceId
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
    }))
}


function normalizeLevel(level) {
  const safe =
    sanitizeString(level)

  const levels =
    Object.values(
      KNOWLEDGE_LEVELS
    )

  return levels.includes(safe)
    ? safe
    : KNOWLEDGE_LEVELS.IDEA
}


function getLevelIndex(level) {
  return Object.values(
    KNOWLEDGE_LEVELS
  ).indexOf(level)
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
    Math.max(number, min),
    max
  )
}


function touch() {
  store.updatedAt =
    new Date().toISOString()
}


function ensureInitialized() {
  if (!store.initialized) {
    initializeBoosterverseCanonEngine()
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
  KNOWLEDGE_LEVELS,

  initializeBoosterverseCanonEngine,

  createKnowledgeEntry,

  getKnowledgeEntry,

  listKnowledge,

  addEvidence,

  promoteKnowledge,

  demoteKnowledge,

  rejectKnowledge,

  createCanonCandidate,

  approveCanon,

  getCanon,

  getCanonCandidates,

  getTruthSummary,

  getBoosterverseCanonEngineHealth,

  clearRuntimeKnowledge,
}


export default {
  id: MODULE_ID,

  name:
    "Boosterverse Canon Engine",

  version:
    MODULE_VERSION,

  description:
    "Boosterversen tiedon totuus-, canon- ja luottamustasojen peruskerros.",

  initialize:
    initializeBoosterverseCanonEngine,

  createKnowledgeEntry,

  getKnowledgeEntry,

  listKnowledge,

  addEvidence,

  promoteKnowledge,

  demoteKnowledge,

  rejectKnowledge,

  createCanonCandidate,

  approveCanon,

  getCanon,

  getCanonCandidates,

  getTruthSummary,

  health:
    getBoosterverseCanonEngineHealth,
}
