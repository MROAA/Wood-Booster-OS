/**
 * Wood-Booster HQ
 * Boosterverse Execution Engine
 *
 * Tarkoitus:
 * - suorittaa yksi Planning Enginen hyväksytty step kerrallaan
 * - tarkistaa capability ennen suoritusta
 * - tarkistaa käyttäjän hyväksyntä
 * - lähettää työ Tool Busille
 * - kirjata suorituksen tulos
 * - estää hallitsematon autonomia
 *
 * Tämä moduuli EI:
 * - keksi tavoitteita
 * - luo suunnitelmia
 * - käytä työkaluja Tool Busin ohi
 * - ohita käyttäjän hyväksyntää
 * - suorita useita steppejä automaattisesti ketjuna
 *
 * Execution Engine tekee vain yhden asian:
 *
 * PLAN STEP
 *   ↓
 * CHECK
 *   ↓
 * EXECUTE
 *   ↓
 * RESULT
 */

const MODULE_ID =
  "boosterverse-execution-engine"

const MODULE_VERSION =
  "1.0.0"

const EXECUTION_STATUS =
  Object.freeze({
    QUEUED: "queued",
    CHECKING: "checking",
    BLOCKED: "blocked",
    RUNNING: "running",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELLED: "cancelled",
  })

const MAX_HISTORY = 1000

const state = {
  initialized: false,

  startedAt: null,
  updatedAt: null,

  currentExecution: null,

  history: [],

  counters: {
    requested: 0,
    blocked: 0,
    started: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  },
}


/**
 * Alustus.
 */
function initializeBoosterverseExecutionEngine() {
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
 * Luo execution requestin.
 *
 * Tämä EI vielä suorita mitään.
 */
function createExecutionRequest({
  planId = null,
  step = null,

  capabilityCheck = null,

  approvedByUser = false,

  source = "spacemonkey",

  metadata = null,
} = {}) {
  ensureInitialized()

  state.counters.requested += 1

  if (
    !step ||
    typeof step !== "object"
  ) {
    return {
      success: false,
      error:
        "Valid plan step is required",
    }
  }

  const now =
    new Date().toISOString()

  const execution = {
    id:
      createId(
        "bv-execution"
      ),

    planId:
      sanitizeString(planId),

    stepId:
      sanitizeString(step.id),

    step: {
      id:
        sanitizeString(step.id),

      title:
        sanitizeString(
          step.title
        ),

      type:
        sanitizeString(
          step.type
        ),

      capability:
        sanitizeString(
          step.capability
        ),

      tool:
        sanitizeString(
          step.tool
        ),

      risk:
        sanitizeString(
          step.risk
        ) || "low",

      requiresApproval:
        Boolean(
          step.requiresApproval
        ),

      approved:
        Boolean(
          step.approved
        ),

      expectedOutput:
        sanitizeString(
          step.expectedOutput
        ),

      metadata:
        step.metadata ?? null,
    },

    capabilityCheck:
      capabilityCheck ?? null,

    approvedByUser:
      Boolean(
        approvedByUser
      ),

    source:
      sanitizeString(source),

    metadata,

    status:
      EXECUTION_STATUS.QUEUED,

    createdAt: now,
    updatedAt: now,

    startedAt: null,
    completedAt: null,

    result: null,
    error: null,
  }

  addHistory({
    action:
      "execution-request-created",

    executionId:
      execution.id,

    planId:
      execution.planId,

    stepId:
      execution.stepId,
  })

  touch()

  return {
    success: true,
    execution:
      clone(execution),
  }
}


/**
 * Tarkistaa voiko requestin suorittaa.
 *
 * Capability Registryn check voidaan
 * antaa valmiina parametrina.
 */
function validateExecution(
  execution
) {
  ensureInitialized()

  if (
    !execution ||
    typeof execution !== "object"
  ) {
    return {
      allowed: false,
      reason:
        "valid-execution-required",
    }
  }

  const step =
    execution.step

  if (!step) {
    return {
      allowed: false,
      reason:
        "execution-has-no-step",
    }
  }

  if (!step.capability) {
    return {
      allowed: false,
      reason:
        "step-has-no-capability",
    }
  }

  if (
    step.requiresApproval &&
    !execution.approvedByUser &&
    !step.approved
  ) {
    return {
      allowed: false,
      reason:
        "user-approval-required",
    }
  }

  const risk =
    normalizeRisk(
      step.risk
    )

  if (
    risk === "critical"
  ) {
    return {
      allowed: false,
      reason:
        "critical-risk-blocked",
    }
  }

  if (
    risk === "high" &&
    !execution.approvedByUser &&
    !step.approved
  ) {
    return {
      allowed: false,
      reason:
        "high-risk-requires-user-approval",
    }
  }

  if (
    execution.capabilityCheck &&
    execution.capabilityCheck
      .allowed === false
  ) {
    return {
      allowed: false,
      reason:
        execution
          .capabilityCheck
          .reason ||
        "capability-check-failed",
    }
  }

  return {
    allowed: true,
    reason:
      "execution-ready",
  }
}


/**
 * Suorittaa yhden stepin Tool Busin kautta.
 *
 * Parametrit:
 *
 * execution
 * executeTool = Tool Busin executeTool
 *
 * Execution Engine ei importtaa Tool Busia
 * suoraan, jotta moduuli pysyy erillisenä
 * ja helposti testattavana.
 */
async function executePlanStep({
  execution,
  executeTool,
  input = null,
} = {}) {
  ensureInitialized()

  const validation =
    validateExecution(
      execution
    )

  if (!validation.allowed) {
    state.counters.blocked += 1

    const blocked =
      updateExecutionState(
        execution,
        {
          status:
            EXECUTION_STATUS.BLOCKED,

          error:
            validation.reason,
        }
      )

    addHistory({
      action:
        "execution-blocked",

      executionId:
        blocked.id,

      reason:
        validation.reason,
    })

    return {
      success: false,
      status:
        EXECUTION_STATUS.BLOCKED,

      reason:
        validation.reason,

      execution:
        clone(blocked),
    }
  }

  if (
    typeof executeTool !==
    "function"
  ) {
    state.counters.blocked += 1

    return {
      success: false,
      status:
        EXECUTION_STATUS.BLOCKED,

      reason:
        "tool-bus-executor-required",
    }
  }

  const step =
    execution.step

  if (!step.tool) {
    return {
      success: false,
      status:
        EXECUTION_STATUS.BLOCKED,

      reason:
        "plan-step-has-no-tool",
    }
  }

  state.counters.started += 1

  state.currentExecution =
    updateExecutionState(
      execution,
      {
        status:
          EXECUTION_STATUS.RUNNING,

        startedAt:
          new Date().toISOString(),
      }
    )

  addHistory({
    action:
      "execution-started",

    executionId:
      execution.id,

    tool:
      step.tool,

    capability:
      step.capability,
  })

  try {
    const toolResult =
      await executeTool({
        toolId:
          step.tool,

        action:
          step.type,

        input,

        approvedByUser:
          Boolean(
            execution
              .approvedByUser ||
            step.approved
          ),

        risk:
          step.risk,

        source:
          MODULE_ID,

        metadata: {
          planId:
            execution.planId,

          stepId:
            execution.stepId,

          executionId:
            execution.id,

          capability:
            step.capability,
        },
      })

    if (
      !toolResult ||
      toolResult.success !== true
    ) {
      const reason =
        sanitizeString(
          toolResult?.error
        ) ||
        sanitizeString(
          toolResult?.reason
        ) ||
        "tool-execution-failed"

      state.counters.failed += 1

      const failed =
        updateExecutionState(
          state.currentExecution,
          {
            status:
              EXECUTION_STATUS.FAILED,

            error:
              reason,

            result:
              toolResult ?? null,

            completedAt:
              new Date().toISOString(),
          }
        )

      state.currentExecution =
        null

      addHistory({
        action:
          "execution-failed",

        executionId:
          failed.id,

        reason,
      })

      touch()

      return {
        success: false,

        status:
          EXECUTION_STATUS.FAILED,

        reason,

        execution:
          clone(failed),
      }
    }

    state.counters.completed += 1

    const completed =
      updateExecutionState(
        state.currentExecution,
        {
          status:
            EXECUTION_STATUS.COMPLETED,

          result:
            toolResult.result ??
            toolResult,

          completedAt:
            new Date().toISOString(),
        }
      )

    state.currentExecution =
      null

    addHistory({
      action:
        "execution-completed",

      executionId:
        completed.id,

      planId:
        completed.planId,

      stepId:
        completed.stepId,
    })

    touch()

    return {
      success: true,

      status:
        EXECUTION_STATUS.COMPLETED,

      result:
        completed.result,

      execution:
        clone(completed),
    }
  } catch (error) {
    state.counters.failed += 1

    const message =
      sanitizeString(
        error?.message
      ) ||
      "unknown-execution-error"

    const failed =
      updateExecutionState(
        state.currentExecution ||
          execution,
        {
          status:
            EXECUTION_STATUS.FAILED,

          error:
            message,

          completedAt:
            new Date().toISOString(),
        }
      )

    state.currentExecution =
      null

    addHistory({
      action:
        "execution-failed",

      executionId:
        failed.id,

      reason:
        message,
    })

    touch()

    return {
      success: false,

      status:
        EXECUTION_STATUS.FAILED,

      reason:
        message,

      execution:
        clone(failed),
    }
  }
}


/**
 * Peruuta nykyinen execution.
 *
 * Tämä ei tapa ulkoista prosessia.
 * Varsinainen cancel-handler voidaan
 * myöhemmin rakentaa Tool Busille.
 */
function cancelCurrentExecution(
  reason = null
) {
  ensureInitialized()

  if (!state.currentExecution) {
    return {
      success: false,
      error:
        "No execution is currently running",
    }
  }

  const cancelled =
    updateExecutionState(
      state.currentExecution,
      {
        status:
          EXECUTION_STATUS.CANCELLED,

        error:
          sanitizeString(reason),

        completedAt:
          new Date().toISOString(),
      }
    )

  state.currentExecution =
    null

  state.counters.cancelled += 1

  addHistory({
    action:
      "execution-cancelled",

    executionId:
      cancelled.id,

    reason:
      sanitizeString(reason),
  })

  touch()

  return {
    success: true,
    execution:
      clone(cancelled),
  }
}


/**
 * Palauttaa nykyisen executionin.
 */
function getCurrentExecution() {
  ensureInitialized()

  return state.currentExecution
    ? clone(
        state.currentExecution
      )
    : null
}


/**
 * Historia.
 */
function getExecutionHistory(
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
 * Spacemonkeylle pieni execution context.
 */
function getExecutionContext() {
  ensureInitialized()

  return {
    running:
      Boolean(
        state.currentExecution
      ),

    currentExecution:
      state.currentExecution
        ? clone(
            state.currentExecution
          )
        : null,

    recentExecutions:
      getExecutionHistory(5),

    rule:
      "Execute only one validated plan step at a time.",
  }
}


/**
 * Yhteenveto.
 */
function getExecutionSummary() {
  ensureInitialized()

  return {
    running:
      Boolean(
        state.currentExecution
      ),

    currentExecutionId:
      state.currentExecution
        ?.id ?? null,

    counters:
      clone(
        state.counters
      ),

    historyEntries:
      state.history.length,

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Health.
 */
function getBoosterverseExecutionEngineHealth() {
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
      getExecutionSummary(),
  }
}


/**
 * Runtime reset testeihin.
 */
function resetExecutionEngine() {
  ensureInitialized()

  state.currentExecution =
    null

  state.history = []

  touch()

  return {
    success: true,
    status: "reset",
  }
}


/**
 * Päivittää execution-objektin.
 */
function updateExecutionState(
  execution,
  patch
) {
  const next = {
    ...clone(execution),
    ...patch,

    updatedAt:
      new Date().toISOString(),
  }

  return next
}


/**
 * Risk normalisointi.
 */
function normalizeRisk(
  risk
) {
  const safe =
    sanitizeString(risk)

  const values = [
    "none",
    "low",
    "medium",
    "high",
    "critical",
  ]

  return values.includes(safe)
    ? safe
    : "low"
}


/**
 * Historia.
 */
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


function touch() {
  state.updatedAt =
    new Date().toISOString()
}


function ensureInitialized() {
  if (!state.initialized) {
    initializeBoosterverseExecutionEngine()
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

  EXECUTION_STATUS,

  initializeBoosterverseExecutionEngine,

  createExecutionRequest,

  validateExecution,

  executePlanStep,

  cancelCurrentExecution,

  getCurrentExecution,

  getExecutionHistory,

  getExecutionContext,

  getExecutionSummary,

  getBoosterverseExecutionEngineHealth,

  resetExecutionEngine,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Execution Engine",

  version:
    MODULE_VERSION,

  description:
    "Boosterversen yhden turvallisen ja hyväksytyn plan-stepin suorittamisen kerros.",

  initialize:
    initializeBoosterverseExecutionEngine,

  createExecutionRequest,

  validateExecution,

  executePlanStep,

  cancelCurrentExecution,

  getCurrentExecution,

  getExecutionHistory,

  getExecutionContext,

  getExecutionSummary,

  health:
    getBoosterverseExecutionEngineHealth,
}
