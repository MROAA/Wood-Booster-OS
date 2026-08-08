/**
 * Wood-Booster HQ
 * Boosterverse Trust Engine
 *
 * Reality First -luottamuskerros.
 *
 * Tarkoitus:
 * - arvioida tiedon luotettavuutta
 * - arvioida lähteiden luotettavuutta
 * - erottaa faktat, havainnot ja epävarmat päätelmät
 * - estää heikon tiedon muuttuminen vahvaksi totuudeksi
 * - tarjota Spacemonkeylle selitettävä trust score
 *
 * Tämä moduuli EI:
 * - kutsu LLM:ää
 * - muuta projektidataa
 * - tee automaatioita
 * - muuta Canon Engineä suoraan
 * - päätä käyttäjän puolesta
 */

const MODULE_ID = "boosterverse-trust-engine"
const MODULE_VERSION = "1.0.0"

const TRUST_LEVELS = Object.freeze({
  UNTRUSTED: "untrusted",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  VERIFIED: "verified",
})

const SOURCE_TYPES = Object.freeze({
  USER: "user",
  DATABASE: "database",
  SYSTEM: "system",
  DOCUMENT: "document",
  AGENT: "agent",
  MEMORY: "memory",
  OBSERVATION: "observation",
  EXTERNAL: "external",
  UNKNOWN: "unknown",
})

const DEFAULT_SOURCE_TRUST = Object.freeze({
  user: 0.85,
  database: 0.98,
  system: 0.95,
  document: 0.8,
  agent: 0.65,
  memory: 0.7,
  observation: 0.6,
  external: 0.5,
  unknown: 0.25,
})

const state = {
  initialized: false,
  startedAt: null,
  updatedAt: null,

  sources: new Map(),
  assessments: new Map(),

  counters: {
    sourcesRegistered: 0,
    assessmentsCreated: 0,
    confirmations: 0,
    contradictions: 0,
    trustIncreases: 0,
    trustDecreases: 0,
  },
}


/**
 * Alustaa Trust Enginen.
 */
function initializeBoosterverseTrustEngine() {
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
 * Rekisteröi tiedon lähteen.
 *
 * Esimerkkejä:
 *
 * prisma-database
 * project-store
 * spacemonkey-memory
 * workshop-agent
 * user-input
 */
function registerSource({
  id,
  name = null,
  type = SOURCE_TYPES.UNKNOWN,
  baseTrust = null,
  description = null,
  metadata = null,
} = {}) {
  ensureInitialized()

  const sourceId = sanitizeString(id)

  if (!sourceId) {
    return {
      success: false,
      error: "Source id is required",
    }
  }

  const safeType = normalizeSourceType(type)

  const existing = state.sources.get(sourceId)

  if (existing) {
    if (name !== null) {
      existing.name = sanitizeString(name)
    }

    if (description !== null) {
      existing.description =
        sanitizeString(description)
    }

    if (metadata !== null) {
      existing.metadata = metadata
    }

    existing.updatedAt =
      new Date().toISOString()

    touch()

    return {
      success: true,
      created: false,
      source: clone(existing),
    }
  }

  const now = new Date().toISOString()

  const trust =
    baseTrust === null
      ? DEFAULT_SOURCE_TRUST[safeType]
      : clampNumber(baseTrust, 0, 1)

  const source = {
    id: sourceId,

    name:
      sanitizeString(name) ||
      sourceId,

    type: safeType,

    baseTrust: trust,
    currentTrust: trust,

    description:
      sanitizeString(description),

    metadata,

    confirmations: 0,
    contradictions: 0,
    uses: 0,

    createdAt: now,
    updatedAt: now,
  }

  state.sources.set(sourceId, source)

  state.counters.sourcesRegistered += 1

  touch()

  return {
    success: true,
    created: true,
    source: clone(source),
  }
}


/**
 * Palauttaa lähteen.
 */
function getSource(sourceId) {
  ensureInitialized()

  const source = state.sources.get(
    sanitizeString(sourceId)
  )

  return source
    ? clone(source)
    : null
}


/**
 * Arvioi yksittäisen tiedon luotettavuuden.
 *
 * Score muodostuu esimerkiksi:
 *
 * - source trust
 * - evidence
 * - confidence
 * - confirmations
 * - contradictions
 * - recency
 */
function assessTrust({
  id = null,
  subjectType = "knowledge",
  subjectId = null,

  sourceId = null,

  confidence = 0.5,

  evidenceCount = 0,
  confirmationCount = 0,
  contradictionCount = 0,

  ageDays = 0,

  userVerified = false,
  systemVerified = false,

  metadata = null,
} = {}) {
  ensureInitialized()

  const assessmentId =
    sanitizeString(id) ||
    createId("bv-trust")

  const source =
    sourceId
      ? state.sources.get(
          sanitizeString(sourceId)
        )
      : null

  const sourceTrust =
    source?.currentTrust ??
    DEFAULT_SOURCE_TRUST.unknown

  const safeConfidence =
    clampNumber(
      confidence,
      0,
      1
    )

  const evidenceScore =
    calculateEvidenceScore(
      evidenceCount
    )

  const confirmationScore =
    calculateConfirmationScore(
      confirmationCount
    )

  const contradictionPenalty =
    calculateContradictionPenalty(
      contradictionCount
    )

  const recencyScore =
    calculateRecencyScore(
      ageDays
    )

  let score =
    sourceTrust * 0.30 +
    safeConfidence * 0.25 +
    evidenceScore * 0.15 +
    confirmationScore * 0.15 +
    recencyScore * 0.15

  score -= contradictionPenalty

  if (systemVerified) {
    score = Math.max(
      score,
      0.9
    )
  }

  if (userVerified) {
    score = Math.max(
      score,
      0.95
    )
  }

  score = clampNumber(
    score,
    0,
    1
  )

  const now =
    new Date().toISOString()

  const assessment = {
    id: assessmentId,

    subject: {
      type:
        sanitizeString(
          subjectType
        ) || "knowledge",

      id:
        sanitizeString(
          subjectId
        ),
    },

    sourceId:
      sanitizeString(sourceId),

    score,

    level:
      scoreToTrustLevel(score),

    factors: {
      sourceTrust,
      confidence:
        safeConfidence,
      evidenceScore,
      confirmationScore,
      contradictionPenalty,
      recencyScore,
      userVerified:
        Boolean(userVerified),
      systemVerified:
        Boolean(systemVerified),
    },

    evidenceCount:
      safeInteger(
        evidenceCount
      ),

    confirmationCount:
      safeInteger(
        confirmationCount
      ),

    contradictionCount:
      safeInteger(
        contradictionCount
      ),

    ageDays:
      Math.max(
        0,
        Number(ageDays) || 0
      ),

    metadata,

    createdAt: now,
    updatedAt: now,
  }

  state.assessments.set(
    assessmentId,
    assessment
  )

  if (source) {
    source.uses += 1
    source.updatedAt = now
  }

  state.counters.assessmentsCreated += 1

  touch()

  return {
    success: true,
    assessment: clone(assessment),
  }
}


/**
 * Lisää vahvistuksen lähteelle.
 */
function confirmSource(
  sourceId,
  {
    strength = 0.02,
    reason = null,
  } = {}
) {
  ensureInitialized()

  const source = state.sources.get(
    sanitizeString(sourceId)
  )

  if (!source) {
    return {
      success: false,
      error: "Source not found",
    }
  }

  const oldTrust =
    source.currentTrust

  source.confirmations += 1

  source.currentTrust =
    clampNumber(
      source.currentTrust +
        clampNumber(
          strength,
          0,
          0.1
        ),
      0,
      1
    )

  source.updatedAt =
    new Date().toISOString()

  state.counters.confirmations += 1

  if (
    source.currentTrust >
    oldTrust
  ) {
    state.counters.trustIncreases += 1
  }

  touch()

  return {
    success: true,

    reason:
      sanitizeString(reason),

    previousTrust:
      oldTrust,

    currentTrust:
      source.currentTrust,

    source:
      clone(source),
  }
}


/**
 * Lisää ristiriidan lähteelle.
 */
function contradictSource(
  sourceId,
  {
    strength = 0.05,
    reason = null,
  } = {}
) {
  ensureInitialized()

  const source = state.sources.get(
    sanitizeString(sourceId)
  )

  if (!source) {
    return {
      success: false,
      error: "Source not found",
    }
  }

  const oldTrust =
    source.currentTrust

  source.contradictions += 1

  source.currentTrust =
    clampNumber(
      source.currentTrust -
        clampNumber(
          strength,
          0,
          0.2
        ),
      0,
      1
    )

  source.updatedAt =
    new Date().toISOString()

  state.counters.contradictions += 1

  if (
    source.currentTrust <
    oldTrust
  ) {
    state.counters.trustDecreases += 1
  }

  touch()

  return {
    success: true,

    reason:
      sanitizeString(reason),

    previousTrust:
      oldTrust,

    currentTrust:
      source.currentTrust,

    source:
      clone(source),
  }
}


/**
 * Palauttaa tietyn assessmentin.
 */
function getTrustAssessment(
  assessmentId
) {
  ensureInitialized()

  const assessment =
    state.assessments.get(
      sanitizeString(
        assessmentId
      )
    )

  return assessment
    ? clone(assessment)
    : null
}


/**
 * Hakee tiettyyn subjectiin
 * liittyvät trust-arviot.
 */
function getSubjectAssessments(
  subjectType,
  subjectId
) {
  ensureInitialized()

  const safeType =
    sanitizeString(
      subjectType
    )

  const safeId =
    sanitizeString(
      subjectId
    )

  return [
    ...state.assessments.values(),
  ]
    .filter(
      (assessment) =>
        assessment.subject.type ===
          safeType &&
        assessment.subject.id ===
          safeId
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
    .map(clone)
}


/**
 * Laskee subjectin kokonaisluottamuksen
 * useiden arvioiden perusteella.
 */
function getSubjectTrust(
  subjectType,
  subjectId
) {
  const assessments =
    getSubjectAssessments(
      subjectType,
      subjectId
    )

  if (
    assessments.length === 0
  ) {
    return {
      score: 0,
      level:
        TRUST_LEVELS.UNTRUSTED,
      assessments: 0,
    }
  }

  const totalWeight =
    assessments.reduce(
      (sum, assessment) =>
        sum +
        Math.max(
          assessment.score,
          0.01
        ),
      0
    )

  const weighted =
    assessments.reduce(
      (sum, assessment) =>
        sum +
        assessment.score *
          Math.max(
            assessment.score,
            0.01
          ),
      0
    )

  const score =
    clampNumber(
      weighted /
        totalWeight,
      0,
      1
    )

  return {
    score,

    level:
      scoreToTrustLevel(
        score
      ),

    assessments:
      assessments.length,
  }
}


/**
 * Reality First -portti.
 *
 * Tällä voidaan myöhemmin tarkistaa,
 * saako Spacemonkey käyttää tietoa
 * vahvana faktana.
 */
function canUseAsFact({
  score = 0,
  userVerified = false,
  systemVerified = false,
} = {}) {
  if (
    userVerified ||
    systemVerified
  ) {
    return {
      allowed: true,
      reason: "verified",
    }
  }

  const safeScore =
    clampNumber(
      score,
      0,
      1
    )

  if (safeScore >= 0.85) {
    return {
      allowed: true,
      reason:
        "trust-threshold-reached",
    }
  }

  return {
    allowed: false,

    reason:
      "insufficient-trust",

    recommendation:
      "Present as uncertain or request verification.",
  }
}


/**
 * Palauttaa lähteet järjestettynä
 * luotettavuuden mukaan.
 */
function listSources({
  type = null,
  limit = 100,
} = {}) {
  ensureInitialized()

  const safeType =
    type
      ? normalizeSourceType(type)
      : null

  return [
    ...state.sources.values(),
  ]
    .filter(
      (source) =>
        !safeType ||
        source.type === safeType
    )
    .sort(
      (a, b) =>
        b.currentTrust -
        a.currentTrust
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
 * Kevyt yhteenveto.
 */
function getTrustSummary() {
  ensureInitialized()

  const trustLevels = {
    untrusted: 0,
    low: 0,
    medium: 0,
    high: 0,
    verified: 0,
  }

  for (
    const assessment
    of state.assessments.values()
  ) {
    trustLevels[
      assessment.level
    ] += 1
  }

  return {
    sources:
      state.sources.size,

    assessments:
      state.assessments.size,

    trustLevels,

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
function getBoosterverseTrustEngineHealth() {
  return {
    moduleId: MODULE_ID,
    version: MODULE_VERSION,

    healthy: true,

    status:
      state.initialized
        ? "running"
        : "idle",

    metrics:
      getTrustSummary(),
  }
}


/**
 * Runtime-datan tyhjennys testeihin.
 */
function clearRuntimeTrust() {
  ensureInitialized()

  state.sources.clear()
  state.assessments.clear()

  state.updatedAt =
    new Date().toISOString()

  return {
    success: true,
    status: "cleared",
  }
}


/**
 * Evidence score.
 *
 * Mitä enemmän riippumatonta evidenssiä,
 * sitä vahvempi piste.
 *
 * Maksimi 1.0.
 */
function calculateEvidenceScore(
  evidenceCount
) {
  const count =
    safeInteger(
      evidenceCount
    )

  if (count <= 0) {
    return 0
  }

  return clampNumber(
    1 -
      Math.exp(
        -count / 3
      ),
    0,
    1
  )
}


/**
 * Confirmation score.
 */
function calculateConfirmationScore(
  confirmationCount
) {
  const count =
    safeInteger(
      confirmationCount
    )

  if (count <= 0) {
    return 0
  }

  return clampNumber(
    1 -
      Math.exp(
        -count / 4
      ),
    0,
    1
  )
}


/**
 * Contradiction penalty.
 */
function calculateContradictionPenalty(
  contradictionCount
) {
  const count =
    safeInteger(
      contradictionCount
    )

  return clampNumber(
    count * 0.12,
    0,
    0.6
  )
}


/**
 * Tiedon ikä vaikuttaa trustiin.
 *
 * 0 päivää -> noin 1
 * vanha tieto laskee hiljalleen.
 *
 * Tämä ei tarkoita että vanha tieto
 * olisi väärää, vaan että sen
 * ajantasaisuus kannattaa tarkistaa.
 */
function calculateRecencyScore(
  ageDays
) {
  const days =
    Math.max(
      0,
      Number(ageDays) || 0
    )

  return clampNumber(
    Math.exp(
      -days / 730
    ),
    0.2,
    1
  )
}


/**
 * Muuttaa score -> selkeä trust level.
 */
function scoreToTrustLevel(score) {
  const safe =
    clampNumber(
      score,
      0,
      1
    )

  if (safe >= 0.95) {
    return TRUST_LEVELS.VERIFIED
  }

  if (safe >= 0.8) {
    return TRUST_LEVELS.HIGH
  }

  if (safe >= 0.55) {
    return TRUST_LEVELS.MEDIUM
  }

  if (safe >= 0.3) {
    return TRUST_LEVELS.LOW
  }

  return TRUST_LEVELS.UNTRUSTED
}


/**
 * Source type normalisointi.
 */
function normalizeSourceType(type) {
  const safe =
    sanitizeString(type)

  const values =
    Object.values(
      SOURCE_TYPES
    )

  return values.includes(safe)
    ? safe
    : SOURCE_TYPES.UNKNOWN
}


function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
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
    initializeBoosterverseTrustEngine()
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

  TRUST_LEVELS,
  SOURCE_TYPES,

  initializeBoosterverseTrustEngine,

  registerSource,

  getSource,

  assessTrust,

  confirmSource,

  contradictSource,

  getTrustAssessment,

  getSubjectAssessments,

  getSubjectTrust,

  canUseAsFact,

  listSources,

  getTrustSummary,

  getBoosterverseTrustEngineHealth,

  clearRuntimeTrust,
}


export default {
  id: MODULE_ID,

  name:
    "Boosterverse Trust Engine",

  version:
    MODULE_VERSION,

  description:
    "Boosterversen Reality First -luottamuskerros tiedolle, lähteille ja havainnoille.",

  initialize:
    initializeBoosterverseTrustEngine,

  registerSource,

  getSource,

  assessTrust,

  confirmSource,

  contradictSource,

  getTrustAssessment,

  getSubjectTrust,

  canUseAsFact,

  listSources,

  getTrustSummary,

  health:
    getBoosterverseTrustEngineHealth,
}
