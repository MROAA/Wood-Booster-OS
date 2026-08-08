/**
 * Wood-Booster HQ
 * Boosterverse Relevance Engine
 *
 * Tarkoitus:
 * - pisteyttää tiedon merkityksellisyys nykyisessä tilanteessa
 * - auttaa Context Fusion Engineä valitsemaan oikea tieto
 * - priorisoida nykyinen projekti, task, intent, focus ja attention
 * - huomioida recency, confidence, trust ja association
 * - pitää AI-context pienenä ja relevanttina
 *
 * Tämä moduuli EI:
 * - kutsu LLM:ää
 * - kirjoita muistia
 * - muuta Canon-tietoa
 * - suorita automaatioita
 * - päätä käyttäjän puolesta
 *
 * Periaate:
 *
 * Current Context
 *      +
 * Candidate Information
 *      ↓
 * Relevance Score
 *      ↓
 * Rank
 *      ↓
 * Context Fusion
 */

const MODULE_ID =
  "boosterverse-relevance-engine"

const MODULE_VERSION =
  "1.0.0"

const RELEVANCE_LEVELS =
  Object.freeze({
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    IRRELEVANT: "irrelevant",
  })

const DEFAULT_WEIGHTS =
  Object.freeze({
    project: 0.22,
    task: 0.18,
    intent: 0.16,
    focus: 0.14,
    attention: 0.1,
    entity: 0.08,
    association: 0.05,
    recency: 0.03,
    confidence: 0.02,
    trust: 0.02,
  })

const MAX_HISTORY = 300

const state = {
  initialized: false,

  startedAt: null,
  updatedAt: null,

  lastContext: null,

  lastRanking: [],

  history: [],

  counters: {
    evaluations: 0,
    candidatesEvaluated: 0,
    rankingsBuilt: 0,
    criticalResults: 0,
    highResults: 0,
    mediumResults: 0,
    lowResults: 0,
    irrelevantResults: 0,
  },
}


/**
 * Alustus.
 */
function initializeBoosterverseRelevanceEngine() {
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
 * Rakentaa relevance-contextin.
 *
 * Tämä sisältää vain ne avaimet,
 * joiden perusteella candidateja verrataan.
 */
function buildRelevanceContext({
  world = null,
  attention = null,
  focus = null,
  intent = null,
  goal = null,
  workflow = null,
} = {}) {
  ensureInitialized()

  const project =
    world?.project ??
    world?.context?.activeProject ??
    null

  const task =
    world?.task ??
    world?.context?.activeTask ??
    null

  const currentAttention =
    attention?.current ??
    attention?.currentAttention ??
    null

  const primaryFocus =
    focus?.primaryFocus ??
    focus?.currentFocus ??
    null

  const currentIntent =
    intent?.currentIntent ??
    intent ??
    null

  const activeGoal =
    goal?.activeGoal ??
    null

  const activeWorkflow =
    workflow?.activeWorkflow ??
    null

  const context = {
    projectId:
      sanitizeString(
        project?.id
      ),

    projectName:
      sanitizeString(
        project?.name ??
        project?.title
      ),

    taskId:
      sanitizeString(
        task?.id
      ),

    taskTitle:
      sanitizeString(
        task?.name ??
        task?.title
      ),

    attentionType:
      sanitizeString(
        currentAttention?.type
      ),

    attentionId:
      sanitizeString(
        currentAttention?.id
      ),

    attentionLabel:
      sanitizeString(
        currentAttention?.label
      ),

    focusType:
      sanitizeString(
        primaryFocus?.type
      ),

    focusId:
      sanitizeString(
        primaryFocus?.id
      ),

    focusTitle:
      sanitizeString(
        primaryFocus?.title
      ),

    intentType:
      sanitizeString(
        currentIntent?.type
      ),

    goalId:
      sanitizeString(
        activeGoal?.id
      ),

    goalTitle:
      sanitizeString(
        activeGoal?.title
      ),

    workflowId:
      sanitizeString(
        activeWorkflow?.id
      ),

    entityIds:
      normalizeStrings([
        project?.id,
        task?.id,
        currentAttention?.id,
        primaryFocus?.id,
        activeGoal?.id,
        activeWorkflow?.id,
      ]),

    keywords:
      buildContextKeywords({
        project,
        task,
        attention:
          currentAttention,
        focus:
          primaryFocus,
        intent:
          currentIntent,
        goal:
          activeGoal,
        workflow:
          activeWorkflow,
      }),

    timestamp:
      new Date().toISOString(),
  }

  state.lastContext =
    clone(context)

  touch()

  return {
    success: true,
    context:
      clone(context),
  }
}


/**
 * Pisteyttää yhden candidate-objektin.
 *
 * Candidate voi olla:
 *
 * memory
 * knowledge
 * event
 * project
 * document
 * association
 * media
 * customer
 * workflow
 */
function scoreCandidate(
  candidate,
  context = state.lastContext,
  {
    weights = null,
  } = {}
) {
  ensureInitialized()

  state.counters.evaluations += 1
  state.counters.candidatesEvaluated += 1

  if (
    !candidate ||
    typeof candidate !== "object"
  ) {
    return {
      success: false,
      error:
        "Valid candidate is required",
    }
  }

  const safeContext =
    context &&
    typeof context === "object"
      ? context
      : {}

  const safeWeights =
    normalizeWeights(
      weights
    )

  const candidateText =
    buildCandidateText(
      candidate
    )

  const candidateIds =
    extractCandidateIds(
      candidate
    )

  const factors = {
    project:
      calculateProjectMatch(
        candidate,
        safeContext,
        candidateText,
        candidateIds
      ),

    task:
      calculateTaskMatch(
        candidate,
        safeContext,
        candidateText,
        candidateIds
      ),

    intent:
      calculateIntentMatch(
        candidate,
        safeContext,
        candidateText
      ),

    focus:
      calculateFocusMatch(
        candidate,
        safeContext,
        candidateText,
        candidateIds
      ),

    attention:
      calculateAttentionMatch(
        candidate,
        safeContext,
        candidateText,
        candidateIds
      ),

    entity:
      calculateEntityMatch(
        candidateIds,
        safeContext
      ),

    association:
      calculateAssociationScore(
        candidate
      ),

    recency:
      calculateRecencyScore(
        candidate
      ),

    confidence:
      extractConfidence(
        candidate
      ),

    trust:
      extractTrust(
        candidate
      ),
  }

  let score = 0

  for (
    const key
    of Object.keys(
      safeWeights
    )
  ) {
    score +=
      (
        factors[key] ??
        0
      ) *
      safeWeights[key]
  }

  score =
    clampNumber(
      score,
      0,
      1
    )

  /**
   * Explicit current project/task
   * matches get a small deterministic boost.
   */
  if (
    factors.project >= 1
  ) {
    score =
      clampNumber(
        score + 0.12,
        0,
        1
      )
  }

  if (
    factors.task >= 1
  ) {
    score =
      clampNumber(
        score + 0.1,
        0,
        1
      )
  }

  const level =
    scoreToRelevanceLevel(
      score
    )

  incrementLevelCounter(
    level
  )

  const result = {
    candidateId:
      sanitizeString(
        candidate.id
      ),

    candidateType:
      sanitizeString(
        candidate.type ??
        candidate.kind ??
        candidate.category
      ),

    score,

    level,

    factors,

    reason:
      buildReason(
        factors,
        safeContext
      ),

    candidate:
      cloneSafe(
        candidate
      ),
  }

  return {
    success: true,
    result,
  }
}


/**
 * Rankkaa joukon candidateja.
 */
function rankCandidates(
  candidates,
  context = state.lastContext,
  {
    limit = 20,
    minScore = 0,
    weights = null,
  } = {}
) {
  ensureInitialized()

  if (
    !Array.isArray(
      candidates
    )
  ) {
    return {
      success: false,
      error:
        "Candidates must be an array",
    }
  }

  const results = []

  for (
    const candidate
    of candidates
  ) {
    const scored =
      scoreCandidate(
        candidate,
        context,
        {
          weights,
        }
      )

    if (
      !scored.success
    ) {
      continue
    }

    if (
      scored.result.score <
      clampNumber(
        minScore,
        0,
        1
      )
    ) {
      continue
    }

    results.push(
      scored.result
    )
  }

  results.sort(
    (a, b) =>
      b.score -
      a.score
  )

  const selected =
    results.slice(
      0,
      Math.max(
        1,
        Number(limit) || 20
      )
    )

  state.lastRanking =
    selected

  state.counters.rankingsBuilt += 1

  addHistory({
    action:
      "relevance-ranking-built",

    candidates:
      candidates.length,

    selected:
      selected.length,

    highestScore:
      selected[0]?.score ??
      null,
  })

  touch()

  return {
    success: true,

    results:
      clone(
        selected
      ),
  }
}


/**
 * Palauttaa vain relevantit
 * candidate-objektit.
 *
 * Context Fusion voi käyttää tätä
 * suoraan muistille ja knowledgelle.
 */
function selectRelevant(
  candidates,
  context = state.lastContext,
  {
    limit = 10,
    minScore = 0.35,
    weights = null,
  } = {}
) {
  const ranked =
    rankCandidates(
      candidates,
      context,
      {
        limit,
        minScore,
        weights,
      }
    )

  if (!ranked.success) {
    return ranked
  }

  return {
    success: true,

    items:
      ranked.results.map(
        (result) => ({
          ...result.candidate,

          relevance:
            result.score,

          relevanceLevel:
            result.level,

          relevanceReason:
            result.reason,

          relevanceFactors:
            result.factors,
        })
      ),
  }
}


/**
 * Memory helper.
 */
function rankMemories(
  memories,
  context,
  options = {}
) {
  return selectRelevant(
    memories,
    context,
    {
      limit:
        options.limit ??
        8,

      minScore:
        options.minScore ??
        0.3,

      weights:
        options.weights ??
        null,
    }
  )
}


/**
 * Knowledge helper.
 */
function rankKnowledge(
  knowledge,
  context,
  options = {}
) {
  return selectRelevant(
    knowledge,
    context,
    {
      limit:
        options.limit ??
        8,

      minScore:
        options.minScore ??
        0.35,

      weights:
        options.weights ??
        null,
    }
  )
}


/**
 * Event helper.
 */
function rankEvents(
  events,
  context,
  options = {}
) {
  return selectRelevant(
    events,
    context,
    {
      limit:
        options.limit ??
        10,

      minScore:
        options.minScore ??
        0.25,

      weights:
        options.weights ??
        null,
    }
  )
}


/**
 * Association helper.
 */
function rankAssociations(
  associations,
  context,
  options = {}
) {
  return selectRelevant(
    associations,
    context,
    {
      limit:
        options.limit ??
        10,

      minScore:
        options.minScore ??
        0.3,

      weights:
        options.weights ??
        null,
    }
  )
}


/**
 * Viimeisin context.
 */
function getLastRelevanceContext() {
  ensureInitialized()

  return state.lastContext
    ? clone(
        state.lastContext
      )
    : null
}


/**
 * Viimeisin ranking.
 */
function getLastRanking(
  limit = 20
) {
  ensureInitialized()

  return state.lastRanking
    .slice(
      0,
      Math.max(
        1,
        Number(limit) || 20
      )
    )
    .map(clone)
}


/**
 * Spacemonkeylle pieni relevance context.
 */
function getRelevanceContext() {
  ensureInitialized()

  return {
    context:
      state.lastContext
        ? clone(
            state.lastContext
          )
        : null,

    topItems:
      getLastRanking(5)
        .map(
          (item) => ({
            candidateId:
              item.candidateId,

            candidateType:
              item.candidateType,

            score:
              item.score,

            level:
              item.level,

            reason:
              item.reason,
          })
        ),

    rule:
      "Prefer information that directly supports the current project, task, focus and intent.",
  }
}


/**
 * Summary.
 */
function getRelevanceSummary() {
  ensureInitialized()

  return {
    hasContext:
      Boolean(
        state.lastContext
      ),

    rankedItems:
      state.lastRanking.length,

    counters:
      clone(
        state.counters
      ),

    updatedAt:
      state.updatedAt,
  }
}


/**
 * History.
 */
function getRelevanceHistory(
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
 * Health.
 */
function getBoosterverseRelevanceEngineHealth() {
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

    metrics:
      getRelevanceSummary(),
  }
}


/**
 * Reset.
 */
function resetRelevanceEngine() {
  ensureInitialized()

  state.lastContext =
    null

  state.lastRanking =
    []

  state.history = []

  state.counters = {
    evaluations: 0,
    candidatesEvaluated: 0,
    rankingsBuilt: 0,
    criticalResults: 0,
    highResults: 0,
    mediumResults: 0,
    lowResults: 0,
    irrelevantResults: 0,
  }

  touch()

  return {
    success: true,
    status: "reset",
  }
}


/**
 * Project match.
 */
function calculateProjectMatch(
  candidate,
  context,
  candidateText,
  candidateIds
) {
  if (
    !context.projectId &&
    !context.projectName
  ) {
    return 0
  }

  if (
    context.projectId &&
    candidateIds.includes(
      context.projectId
    )
  ) {
    return 1
  }

  const candidateProjectId =
    sanitizeString(
      candidate.projectId ??
      candidate.entity
        ?.projectId
    )

  if (
    candidateProjectId &&
    candidateProjectId ===
      context.projectId
  ) {
    return 1
  }

  if (
    context.projectName &&
    candidateText.includes(
      context.projectName
        .toLowerCase()
    )
  ) {
    return 0.8
  }

  return 0
}


/**
 * Task match.
 */
function calculateTaskMatch(
  candidate,
  context,
  candidateText,
  candidateIds
) {
  if (
    !context.taskId &&
    !context.taskTitle
  ) {
    return 0
  }

  if (
    context.taskId &&
    candidateIds.includes(
      context.taskId
    )
  ) {
    return 1
  }

  const candidateTaskId =
    sanitizeString(
      candidate.taskId
    )

  if (
    candidateTaskId &&
    candidateTaskId ===
      context.taskId
  ) {
    return 1
  }

  if (
    context.taskTitle &&
    candidateText.includes(
      context.taskTitle
        .toLowerCase()
    )
  ) {
    return 0.8
  }

  return 0
}


/**
 * Intent match.
 */
function calculateIntentMatch(
  candidate,
  context,
  candidateText
) {
  if (!context.intentType) {
    return 0
  }

  const normalizedIntent =
    context.intentType
      .replaceAll("-", " ")
      .toLowerCase()

  if (
    candidateText.includes(
      context.intentType
        .toLowerCase()
    )
  ) {
    return 1
  }

  const words =
    normalizedIntent
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 2
      )

  if (
    words.length === 0
  ) {
    return 0
  }

  const matches =
    words.filter(
      (word) =>
        candidateText.includes(
          word
        )
    ).length

  return clampNumber(
    matches /
      words.length,
    0,
    1
  )
}


/**
 * Focus match.
 */
function calculateFocusMatch(
  candidate,
  context,
  candidateText,
  candidateIds
) {
  if (
    !context.focusId &&
    !context.focusTitle
  ) {
    return 0
  }

  if (
    context.focusId &&
    candidateIds.includes(
      context.focusId
    )
  ) {
    return 1
  }

  if (
    context.focusTitle &&
    candidateText.includes(
      context.focusTitle
        .toLowerCase()
    )
  ) {
    return 0.85
  }

  return 0
}


/**
 * Attention match.
 */
function calculateAttentionMatch(
  candidate,
  context,
  candidateText,
  candidateIds
) {
  if (
    !context.attentionId &&
    !context.attentionLabel
  ) {
    return 0
  }

  if (
    context.attentionId &&
    candidateIds.includes(
      context.attentionId
    )
  ) {
    return 1
  }

  if (
    context.attentionLabel &&
    candidateText.includes(
      context.attentionLabel
        .toLowerCase()
    )
  ) {
    return 0.8
  }

  return 0
}


/**
 * Entity match.
 */
function calculateEntityMatch(
  candidateIds,
  context
) {
  if (
    !Array.isArray(
      context.entityIds
    ) ||
    context.entityIds.length === 0
  ) {
    return 0
  }

  const matches =
    candidateIds.filter(
      (id) =>
        context.entityIds.includes(
          id
        )
    )

  if (
    matches.length === 0
  ) {
    return 0
  }

  return clampNumber(
    matches.length /
      context.entityIds.length +
      0.4,
    0,
    1
  )
}


/**
 * Association score.
 *
 * Association Engine voi antaa
 * weight/associationWeight-arvon.
 */
function calculateAssociationScore(
  candidate
) {
  return clampNumber(
    candidate.associationWeight ??
    candidate.weight ??
    candidate.associationScore ??
    0,
    0,
    1
  )
}


/**
 * Recency.
 *
 * Uusi tieto saa korkeamman arvon,
 * mutta vanhaa tietoa ei automaattisesti
 * luokitella vääräksi.
 */
function calculateRecencyScore(
  candidate
) {
  const timestamp =
    candidate.updatedAt ??
    candidate.createdAt ??
    candidate.timestamp ??
    null

  if (!timestamp) {
    return 0.5
  }

  const time =
    new Date(
      timestamp
    ).getTime()

  if (
    Number.isNaN(time)
  ) {
    return 0.5
  }

  const ageMs =
    Math.max(
      0,
      Date.now() - time
    )

  const day =
    24 *
    60 *
    60 *
    1000

  const days =
    ageMs / day

  if (days <= 1) {
    return 1
  }

  if (days <= 7) {
    return 0.9
  }

  if (days <= 30) {
    return 0.75
  }

  if (days <= 180) {
    return 0.6
  }

  if (days <= 730) {
    return 0.45
  }

  return 0.3
}


/**
 * Confidence.
 */
function extractConfidence(
  candidate
) {
  return clampNumber(
    candidate.confidence ??
    candidate.metadata
      ?.confidence ??
    0.7,
    0,
    1
  )
}


/**
 * Trust.
 */
function extractTrust(
  candidate
) {
  return clampNumber(
    candidate.trust ??
    candidate.trustScore ??
    candidate.metadata
      ?.trust ??
    0.7,
    0,
    1
  )
}


/**
 * Candidate IDs.
 */
function extractCandidateIds(
  candidate
) {
  return normalizeStrings([
    candidate.id,

    candidate.projectId,
    candidate.customerId,
    candidate.taskId,
    candidate.workflowId,

    candidate.entityId,

    candidate.entity?.id,

    candidate.entity
      ?.projectId,

    candidate.parentId,

    candidate.parent?.id,

    ...(Array.isArray(
      candidate.entityIds
    )
      ? candidate.entityIds
      : []),
  ])
}


/**
 * Candidate text.
 */
function buildCandidateText(
  candidate
) {
  const parts = []

  collectStrings(
    candidate,
    parts,
    0
  )

  return parts
    .join(" ")
    .toLowerCase()
}


/**
 * Kerää kohtuullinen määrä stringejä
 * objektista ilman hallitsematonta recursea.
 */
function collectStrings(
  value,
  result,
  depth
) {
  if (
    depth > 3 ||
    value === null ||
    value === undefined
  ) {
    return
  }

  if (
    typeof value === "string"
  ) {
    result.push(value)
    return
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return
  }

  if (
    Array.isArray(value)
  ) {
    for (
      const item
      of value.slice(0, 20)
    ) {
      collectStrings(
        item,
        result,
        depth + 1
      )
    }

    return
  }

  if (
    typeof value === "object"
  ) {
    const keys =
      Object.keys(value)
        .slice(0, 40)

    for (
      const key
      of keys
    ) {
      collectStrings(
        value[key],
        result,
        depth + 1
      )
    }
  }
}


/**
 * Context keywords.
 */
function buildContextKeywords({
  project,
  task,
  attention,
  focus,
  intent,
  goal,
  workflow,
}) {
  return normalizeStrings([
    project?.name,
    project?.title,

    task?.name,
    task?.title,

    attention?.label,
    attention?.type,

    focus?.title,
    focus?.type,

    intent?.type,

    goal?.title,
    goal?.type,

    workflow?.title,
    workflow?.status,
  ])
}


/**
 * Selitettävä reason.
 */
function buildReason(
  factors,
  context
) {
  const strongest =
    Object.entries(
      factors
    )
      .sort(
        ([, a], [, b]) =>
          b - a
      )
      .filter(
        ([, value]) =>
          value > 0
      )
      .slice(0, 3)

  if (
    strongest.length === 0
  ) {
    return (
      context.projectId
        ? "No strong relationship to the current context was found."
        : "No active relevance context is available."
    )
  }

  return strongest
    .map(
      ([key, value]) =>
        `${key}:${Math.round(
          value * 100
        )}%`
    )
    .join(", ")
}


/**
 * Score -> level.
 */
function scoreToRelevanceLevel(
  score
) {
  const safe =
    clampNumber(
      score,
      0,
      1
    )

  if (safe >= 0.8) {
    return RELEVANCE_LEVELS.CRITICAL
  }

  if (safe >= 0.6) {
    return RELEVANCE_LEVELS.HIGH
  }

  if (safe >= 0.4) {
    return RELEVANCE_LEVELS.MEDIUM
  }

  if (safe >= 0.2) {
    return RELEVANCE_LEVELS.LOW
  }

  return RELEVANCE_LEVELS.IRRELEVANT
}


/**
 * Level counters.
 */
function incrementLevelCounter(
  level
) {
  switch (level) {
    case RELEVANCE_LEVELS.CRITICAL:
      state.counters
        .criticalResults += 1
      break

    case RELEVANCE_LEVELS.HIGH:
      state.counters
        .highResults += 1
      break

    case RELEVANCE_LEVELS.MEDIUM:
      state.counters
        .mediumResults += 1
      break

    case RELEVANCE_LEVELS.LOW:
      state.counters
        .lowResults += 1
      break

    case RELEVANCE_LEVELS.IRRELEVANT:
      state.counters
        .irrelevantResults += 1
      break

    default:
      break
  }
}


/**
 * Painot.
 */
function normalizeWeights(
  custom
) {
  const merged = {
    ...DEFAULT_WEIGHTS,

    ...(
      custom &&
      typeof custom === "object"
        ? custom
        : {}
    ),
  }

  const result = {}

  let total = 0

  for (
    const key
    of Object.keys(
      DEFAULT_WEIGHTS
    )
  ) {
    result[key] =
      clampNumber(
        merged[key],
        0,
        1
      )

    total +=
      result[key]
  }

  if (total <= 0) {
    return clone(
      DEFAULT_WEIGHTS
    )
  }

  for (
    const key
    of Object.keys(
      result
    )
  ) {
    result[key] =
      result[key] /
      total
  }

  return result
}


function addHistory(entry) {
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


function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}


function cloneSafe(value) {
  if (
    value === undefined
  ) {
    return null
  }

  try {
    return JSON.parse(
      JSON.stringify(value)
    )
  } catch {
    return null
  }
}


function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  )
}


function touch() {
  state.updatedAt =
    new Date().toISOString()
}


function ensureInitialized() {
  if (!state.initialized) {
    initializeBoosterverseRelevanceEngine()
  }
}


export {
  MODULE_ID,
  MODULE_VERSION,

  RELEVANCE_LEVELS,

  initializeBoosterverseRelevanceEngine,

  buildRelevanceContext,

  scoreCandidate,

  rankCandidates,

  selectRelevant,

  rankMemories,

  rankKnowledge,

  rankEvents,

  rankAssociations,

  getLastRelevanceContext,

  getLastRanking,

  getRelevanceContext,

  getRelevanceSummary,

  getRelevanceHistory,

  getBoosterverseRelevanceEngineHealth,

  resetRelevanceEngine,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Relevance Engine",

  version:
    MODULE_VERSION,

  description:
    "Pisteyttää Boosterversen muistit, tiedon, tapahtumat ja assosiaatiot nykyisen projektin, tehtävän, fokuksen ja intentin perusteella.",

  initialize:
    initializeBoosterverseRelevanceEngine,

  buildRelevanceContext,

  scoreCandidate,

  rankCandidates,

  selectRelevant,

  rankMemories,

  rankKnowledge,

  rankEvents,

  rankAssociations,

  getLastRelevanceContext,

  getLastRanking,

  getRelevanceContext,

  getRelevanceSummary,

  getRelevanceHistory,

  health:
    getBoosterverseRelevanceEngineHealth,
}
