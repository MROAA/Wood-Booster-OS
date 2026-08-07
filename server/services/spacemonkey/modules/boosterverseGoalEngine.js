/**
 * Wood-Booster OS
 * Boosterverse Goal Engine
 *
 * Tarkoitus:
 * - muuttaa intent hallituksi tavoitteeksi
 * - ylläpitää aktiivisia tavoitteita
 * - priorisoida tavoitteita
 * - seurata etenemistä
 * - tarjota Planning Enginelle selkeä tavoite
 *
 * Tämä moduuli EI:
 * - kutsu LLM:ää
 * - suorita automaatioita
 * - muuta projektidataa
 * - tee korkean riskin päätöksiä
 *
 * Goal Engine määrittää MITÄ tavoitellaan.
 * Planning Engine määrittää myöhemmin MITEN.
 */

const MODULE_ID = "boosterverse-goal-engine"
const MODULE_VERSION = "1.0.0"

const GOAL_STATUS = Object.freeze({
  DRAFT: "draft",
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  FAILED: "failed",
})

const GOAL_PRIORITY = Object.freeze({
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  CRITICAL: "critical",
})

const MAX_GOALS = 500
const MAX_HISTORY = 200

const state = {
  initialized: false,
  startedAt: null,
  updatedAt: null,

  goals: new Map(),

  activeGoalId: null,

  history: [],

  counters: {
    created: 0,
    activated: 0,
    completed: 0,
    paused: 0,
    cancelled: 0,
    failed: 0,
  },
}


/**
 * Alustus.
 */
function initializeBoosterverseGoalEngine() {
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
 * Luo uuden tavoitteen.
 */
function createGoal({
  id = null,
  title = null,
  description = null,

  type = "general",

  priority = GOAL_PRIORITY.NORMAL,

  sourceIntent = null,

  projectId = null,
  customerId = null,

  successCriteria = [],

  constraints = [],

  metadata = null,
} = {}) {
  ensureInitialized()

  if (state.goals.size >= MAX_GOALS) {
    return {
      success: false,
      error: "Goal limit reached",
    }
  }

  const goalId =
    sanitizeString(id) ||
    createId("bv-goal")

  if (state.goals.has(goalId)) {
    return {
      success: false,
      error: `Goal already exists: ${goalId}`,
    }
  }

  const now = new Date().toISOString()

  const goal = {
    id: goalId,

    title:
      sanitizeString(title) ||
      "Untitled goal",

    description:
      sanitizeString(description),

    type:
      sanitizeString(type) ||
      "general",

    priority:
      normalizePriority(priority),

    status:
      GOAL_STATUS.DRAFT,

    progress: 0,

    sourceIntent:
      normalizeIntent(sourceIntent),

    context: {
      projectId:
        sanitizeString(projectId),

      customerId:
        sanitizeString(customerId),
    },

    successCriteria:
      normalizeStrings(successCriteria),

    constraints:
      normalizeStrings(constraints),

    metadata,

    createdAt: now,
    updatedAt: now,

    activatedAt: null,
    completedAt: null,
  }

  state.goals.set(
    goalId,
    goal
  )

  state.counters.created += 1

  addHistory({
    action: "goal-created",
    goalId,
    title: goal.title,
  })

  touch()

  return {
    success: true,
    goal: clone(goal),
  }
}


/**
 * Luo tavoitteen suoraan Intent Enginen
 * nykyisestä intentistä.
 */
function createGoalFromIntent(
  intent,
  {
    title = null,
    description = null,
    projectId = null,
    customerId = null,
    priority = GOAL_PRIORITY.NORMAL,
    successCriteria = [],
    constraints = [],
    metadata = null,
  } = {}
) {
  ensureInitialized()

  if (
    !intent ||
    typeof intent !== "object"
  ) {
    return {
      success: false,
      error: "Valid intent is required",
    }
  }

  const intentType =
    sanitizeString(
      intent.type
    ) || "unknown"

  const generatedTitle =
    title ||
    intentToGoalTitle(
      intentType
    )

  return createGoal({
    title:
      generatedTitle,

    description:
      description ||
      intent.reason ||
      null,

    type:
      intentType,

    priority,

    sourceIntent:
      intent,

    projectId,
    customerId,

    successCriteria,
    constraints,

    metadata: {
      ...(metadata || {}),
      intentConfidence:
        intent.confidence ?? 0,
    },
  })
}


/**
 * Aktivoi tavoitteen.
 *
 * Yksi tavoite voidaan merkitä
 * ensisijaiseksi aktiiviseksi tavoitteeksi.
 */
function activateGoal(goalId) {
  ensureInitialized()

  const goal =
    getGoalReference(goalId)

  if (!goal) {
    return {
      success: false,
      error: "Goal not found",
    }
  }

  if (
    goal.status ===
    GOAL_STATUS.COMPLETED
  ) {
    return {
      success: false,
      error:
        "Completed goal cannot be activated",
    }
  }

  if (
    goal.status ===
    GOAL_STATUS.CANCELLED
  ) {
    return {
      success: false,
      error:
        "Cancelled goal cannot be activated",
    }
  }

  const previousActive =
    state.activeGoalId

  if (
    previousActive &&
    previousActive !== goal.id
  ) {
    const previousGoal =
      state.goals.get(
        previousActive
      )

    if (
      previousGoal &&
      previousGoal.status ===
        GOAL_STATUS.ACTIVE
    ) {
      previousGoal.status =
        GOAL_STATUS.PAUSED

      previousGoal.updatedAt =
        new Date().toISOString()
    }
  }

  const now =
    new Date().toISOString()

  goal.status =
    GOAL_STATUS.ACTIVE

  goal.activatedAt =
    goal.activatedAt || now

  goal.updatedAt = now

  state.activeGoalId =
    goal.id

  state.counters.activated += 1

  addHistory({
    action: "goal-activated",
    goalId: goal.id,
    previousActiveGoalId:
      previousActive,
  })

  touch()

  return {
    success: true,
    goal: clone(goal),
  }
}


/**
 * Pause.
 */
function pauseGoal(
  goalId,
  reason = null
) {
  ensureInitialized()

  const goal =
    getGoalReference(goalId)

  if (!goal) {
    return {
      success: false,
      error: "Goal not found",
    }
  }

  if (
    goal.status !==
    GOAL_STATUS.ACTIVE
  ) {
    return {
      success: false,
      error:
        "Only active goals can be paused",
    }
  }

  goal.status =
    GOAL_STATUS.PAUSED

  goal.updatedAt =
    new Date().toISOString()

  if (
    state.activeGoalId ===
    goal.id
  ) {
    state.activeGoalId = null
  }

  state.counters.paused += 1

  addHistory({
    action: "goal-paused",
    goalId: goal.id,
    reason:
      sanitizeString(reason),
  })

  touch()

  return {
    success: true,
    goal: clone(goal),
  }
}


/**
 * Progress 0..1
 */
function updateGoalProgress(
  goalId,
  progress,
  note = null
) {
  ensureInitialized()

  const goal =
    getGoalReference(goalId)

  if (!goal) {
    return {
      success: false,
      error: "Goal not found",
    }
  }

  const safeProgress =
    clampNumber(
      progress,
      0,
      1
    )

  goal.progress =
    safeProgress

  goal.updatedAt =
    new Date().toISOString()

  addHistory({
    action:
      "goal-progress-updated",

    goalId:
      goal.id,

    progress:
      safeProgress,

    note:
      sanitizeString(note),
  })

  touch()

  return {
    success: true,
    goal: clone(goal),
  }
}


/**
 * Valmis.
 */
function completeGoal(
  goalId,
  {
    note = null,
    result = null,
  } = {}
) {
  ensureInitialized()

  const goal =
    getGoalReference(goalId)

  if (!goal) {
    return {
      success: false,
      error: "Goal not found",
    }
  }

  const now =
    new Date().toISOString()

  goal.status =
    GOAL_STATUS.COMPLETED

  goal.progress = 1

  goal.completedAt = now
  goal.updatedAt = now

  goal.result =
    result ?? null

  if (
    state.activeGoalId ===
    goal.id
  ) {
    state.activeGoalId = null
  }

  state.counters.completed += 1

  addHistory({
    action:
      "goal-completed",

    goalId:
      goal.id,

    note:
      sanitizeString(note),
  })

  touch()

  return {
    success: true,
    goal: clone(goal),
  }
}


/**
 * Cancel.
 */
function cancelGoal(
  goalId,
  reason = null
) {
  ensureInitialized()

  const goal =
    getGoalReference(goalId)

  if (!goal) {
    return {
      success: false,
      error: "Goal not found",
    }
  }

  goal.status =
    GOAL_STATUS.CANCELLED

  goal.updatedAt =
    new Date().toISOString()

  goal.cancelReason =
    sanitizeString(reason)

  if (
    state.activeGoalId ===
    goal.id
  ) {
    state.activeGoalId = null
  }

  state.counters.cancelled += 1

  addHistory({
    action:
      "goal-cancelled",

    goalId:
      goal.id,

    reason:
      sanitizeString(reason),
  })

  touch()

  return {
    success: true,
    goal: clone(goal),
  }
}


/**
 * Failed.
 */
function failGoal(
  goalId,
  reason = null
) {
  ensureInitialized()

  const goal =
    getGoalReference(goalId)

  if (!goal) {
    return {
      success: false,
      error: "Goal not found",
    }
  }

  goal.status =
    GOAL_STATUS.FAILED

  goal.updatedAt =
    new Date().toISOString()

  goal.failureReason =
    sanitizeString(reason)

  if (
    state.activeGoalId ===
    goal.id
  ) {
    state.activeGoalId = null
  }

  state.counters.failed += 1

  addHistory({
    action:
      "goal-failed",

    goalId:
      goal.id,

    reason:
      sanitizeString(reason),
  })

  touch()

  return {
    success: true,
    goal: clone(goal),
  }
}


/**
 * Hakee tavoitteen.
 */
function getGoal(goalId) {
  ensureInitialized()

  const goal =
    getGoalReference(goalId)

  return goal
    ? clone(goal)
    : null
}


/**
 * Aktiivinen tavoite.
 */
function getActiveGoal() {
  ensureInitialized()

  if (!state.activeGoalId) {
    return null
  }

  const goal =
    state.goals.get(
      state.activeGoalId
    )

  return goal
    ? clone(goal)
    : null
}


/**
 * Listaa tavoitteet.
 */
function listGoals({
  status = null,
  priority = null,
  projectId = null,
  limit = 100,
} = {}) {
  ensureInitialized()

  return [
    ...state.goals.values(),
  ]
    .filter((goal) => {
      if (
        status &&
        goal.status !== status
      ) {
        return false
      }

      if (
        priority &&
        goal.priority !==
          normalizePriority(
            priority
          )
      ) {
        return false
      }

      if (
        projectId &&
        goal.context
          .projectId !==
          projectId
      ) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      const priorityDifference =
        priorityToScore(
          b.priority
        ) -
        priorityToScore(
          a.priority
        )

      if (
        priorityDifference !== 0
      ) {
        return priorityDifference
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
 * Planning Engineä varten.
 */
function getGoalContext() {
  ensureInitialized()

  const activeGoal =
    getActiveGoal()

  return {
    activeGoal,

    queuedGoals:
      listGoals({
        status:
          GOAL_STATUS.DRAFT,
        limit: 5,
      }),

    pausedGoals:
      listGoals({
        status:
          GOAL_STATUS.PAUSED,
        limit: 5,
      }),

    guidance:
      buildGoalGuidance(
        activeGoal
      ),
  }
}


/**
 * Yhteenveto.
 */
function getGoalSummary() {
  ensureInitialized()

  const statuses = {}

  for (
    const goal
    of state.goals.values()
  ) {
    statuses[
      goal.status
    ] =
      (statuses[
        goal.status
      ] || 0) + 1
  }

  return {
    totalGoals:
      state.goals.size,

    activeGoalId:
      state.activeGoalId,

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
 * Historia.
 */
function getGoalHistory(
  limit = 50
) {
  ensureInitialized()

  return state.history
    .slice(
      -Math.max(
        1,
        Math.min(
          Number(limit) || 50,
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
function getBoosterverseGoalEngineHealth() {
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
      getGoalSummary(),
  }
}


/**
 * Runtime reset testeihin.
 */
function resetGoalEngine() {
  ensureInitialized()

  state.goals.clear()

  state.activeGoalId = null

  state.history = []

  touch()

  return {
    success: true,
    status: "reset",
  }
}


/**
 * Intent -> ymmärrettävä goal title.
 */
function intentToGoalTitle(
  intentType
) {
  const titles = {
    "continue-work":
      "Continue current work",

    "view-project":
      "Review active project",

    "edit-project":
      "Continue active project",

    "plan-work":
      "Plan next work",

    "complete-task":
      "Complete current task",

    "create-quote":
      "Prepare project quote",

    "review-costs":
      "Review project costs",

    "manage-materials":
      "Prepare required materials",

    "check-inventory":
      "Check inventory",

    "manage-customer":
      "Handle customer work",

    "find-information":
      "Find required information",

    "document-work":
      "Document current work",

    "edit-media":
      "Prepare project media",

    "prepare-social":
      "Prepare social media content",

    "review-progress":
      "Review work progress",

    "resume-interrupted-work":
      "Resume interrupted work",

    unknown:
      "Clarify current goal",
  }

  return (
    titles[intentType] ||
    "Continue current work"
  )
}


/**
 * Guidance.
 */
function buildGoalGuidance(
  activeGoal
) {
  if (!activeGoal) {
    return {
      type:
        "no-active-goal",

      message:
        "No active goal is currently selected.",
    }
  }

  if (
    activeGoal.progress >= 1
  ) {
    return {
      type:
        "goal-ready-to-complete",

      message:
        "The active goal appears complete.",
    }
  }

  return {
    type:
      "continue-active-goal",

    message:
      activeGoal.title,
  }
}


function normalizeIntent(intent) {
  if (
    !intent ||
    typeof intent !== "object"
  ) {
    return null
  }

  return {
    id:
      sanitizeString(
        intent.id
      ),

    type:
      sanitizeString(
        intent.type
      ),

    confidence:
      clampNumber(
        intent.confidence ?? 0,
        0,
        1
      ),

    reason:
      sanitizeString(
        intent.reason
      ),

    evidence:
      normalizeStrings(
        intent.evidence
      ),
  }
}


function normalizePriority(
  priority
) {
  const safe =
    sanitizeString(
      priority
    )

  const values =
    Object.values(
      GOAL_PRIORITY
    )

  return values.includes(safe)
    ? safe
    : GOAL_PRIORITY.NORMAL
}


function priorityToScore(
  priority
) {
  switch (
    normalizePriority(
      priority
    )
  ) {
    case GOAL_PRIORITY.CRITICAL:
      return 4

    case GOAL_PRIORITY.HIGH:
      return 3

    case GOAL_PRIORITY.NORMAL:
      return 2

    case GOAL_PRIORITY.LOW:
      return 1

    default:
      return 2
  }
}


function getGoalReference(
  goalId
) {
  return state.goals.get(
    sanitizeString(goalId)
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
    initializeBoosterverseGoalEngine()
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

  GOAL_STATUS,
  GOAL_PRIORITY,

  initializeBoosterverseGoalEngine,

  createGoal,

  createGoalFromIntent,

  activateGoal,

  pauseGoal,

  updateGoalProgress,

  completeGoal,

  cancelGoal,

  failGoal,

  getGoal,

  getActiveGoal,

  listGoals,

  getGoalContext,

  getGoalSummary,

  getGoalHistory,

  getBoosterverseGoalEngineHealth,

  resetGoalEngine,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Goal Engine",

  version:
    MODULE_VERSION,

  description:
    "Boosterversen hallittu tavoitekerros Intent Enginen ja tulevan Planning Enginen välille.",

  initialize:
    initializeBoosterverseGoalEngine,

  createGoal,

  createGoalFromIntent,

  activateGoal,

  pauseGoal,

  updateGoalProgress,

  completeGoal,

  cancelGoal,

  failGoal,

  getGoal,

  getActiveGoal,

  listGoals,

  getGoalContext,

  getGoalSummary,

  getGoalHistory,

  health:
    getBoosterverseGoalEngineHealth,
}
