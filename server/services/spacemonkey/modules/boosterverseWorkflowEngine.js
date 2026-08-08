/**
 * Wood-Booster HQ
 * Boosterverse Workflow Engine
 *
 * Tarkoitus:
 * - hallita kokonaisen planin etenemistä
 * - tietää mikä step on seuraavana
 * - pysähtyä hyväksyntään
 * - pysähtyä puuttuvaan capabilityyn
 * - välittää yksi step kerrallaan Execution Enginelle
 * - päivittää workflow-tilaa tulosten perusteella
 *
 * TÄMÄ MODUULI EI:
 * - käytä työkaluja suoraan
 * - ohita Tool Bussia
 * - ohita Capability Registryä
 * - ohita käyttäjän hyväksyntää
 * - keksi omia tavoitteita
 *
 * Turvallinen ketju:
 *
 * Goal
 *   ↓
 * Plan
 *   ↓
 * Workflow
 *   ↓
 * Capability Check
 *   ↓
 * Execution Engine
 *   ↓
 * Tool Bus
 */

const MODULE_ID =
  "boosterverse-workflow-engine"

const MODULE_VERSION =
  "1.0.0"

const WORKFLOW_STATUS =
  Object.freeze({
    CREATED: "created",
    READY: "ready",
    RUNNING: "running",
    WAITING_APPROVAL:
      "waiting-approval",
    WAITING_CAPABILITY:
      "waiting-capability",
    WAITING_TOOL:
      "waiting-tool",
    PAUSED: "paused",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELLED: "cancelled",
  })

const MAX_WORKFLOWS = 300
const MAX_HISTORY = 1000

const state = {
  initialized: false,

  startedAt: null,
  updatedAt: null,

  workflows: new Map(),

  activeWorkflowId: null,

  history: [],

  counters: {
    created: 0,
    started: 0,
    stepsRequested: 0,
    stepsCompleted: 0,
    approvalsWaited: 0,
    capabilitiesMissing: 0,
    toolsMissing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  },
}


/**
 * Alustus.
 */
function initializeBoosterverseWorkflowEngine() {
  if (state.initialized) {
    return {
      success: true,
      status:
        "already-initialized",
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
 * Luo workflow planista.
 */
function createWorkflow({
  id = null,

  goalId = null,
  planId = null,

  title = null,

  projectId = null,

  metadata = null,
} = {}) {
  ensureInitialized()

  if (
    state.workflows.size >=
    MAX_WORKFLOWS
  ) {
    return {
      success: false,
      error:
        "Workflow limit reached",
    }
  }

  const workflowId =
    sanitizeString(id) ||
    createId("bv-workflow")

  if (
    state.workflows.has(
      workflowId
    )
  ) {
    return {
      success: false,
      error:
        `Workflow already exists: ${workflowId}`,
    }
  }

  if (!planId) {
    return {
      success: false,
      error:
        "Workflow requires planId",
    }
  }

  const now =
    new Date().toISOString()

  const workflow = {
    id: workflowId,

    goalId:
      sanitizeString(goalId),

    planId:
      sanitizeString(planId),

    projectId:
      sanitizeString(projectId),

    title:
      sanitizeString(title) ||
      "Boosterverse Workflow",

    status:
      WORKFLOW_STATUS.CREATED,

    progress: 0,

    currentStepId: null,

    completedStepIds: [],

    failedStepIds: [],

    waiting: null,

    metadata,

    createdAt: now,
    updatedAt: now,

    startedAt: null,
    completedAt: null,
  }

  state.workflows.set(
    workflowId,
    workflow
  )

  state.counters.created += 1

  addHistory({
    action:
      "workflow-created",

    workflowId,

    goalId:
      workflow.goalId,

    planId:
      workflow.planId,
  })

  touch()

  return {
    success: true,
    workflow:
      clone(workflow),
  }
}


/**
 * Käynnistää workflow'n.
 */
function startWorkflow(
  workflowId
) {
  ensureInitialized()

  const workflow =
    getWorkflowReference(
      workflowId
    )

  if (!workflow) {
    return {
      success: false,
      error:
        "Workflow not found",
    }
  }

  if (
    [
      WORKFLOW_STATUS.COMPLETED,
      WORKFLOW_STATUS.CANCELLED,
    ].includes(
      workflow.status
    )
  ) {
    return {
      success: false,
      error:
        "Workflow cannot be started",
    }
  }

  const previousId =
    state.activeWorkflowId

  if (
    previousId &&
    previousId !==
      workflow.id
  ) {
    const previous =
      state.workflows.get(
        previousId
      )

    if (
      previous &&
      previous.status ===
        WORKFLOW_STATUS.RUNNING
    ) {
      previous.status =
        WORKFLOW_STATUS.PAUSED

      previous.updatedAt =
        new Date().toISOString()
    }
  }

  const now =
    new Date().toISOString()

  workflow.status =
    WORKFLOW_STATUS.RUNNING

  workflow.startedAt =
    workflow.startedAt || now

  workflow.updatedAt = now

  workflow.waiting = null

  state.activeWorkflowId =
    workflow.id

  state.counters.started += 1

  addHistory({
    action:
      "workflow-started",

    workflowId:
      workflow.id,
  })

  touch()

  return {
    success: true,
    workflow:
      clone(workflow),
  }
}


/**
 * Workflow'n tärkein funktio.
 *
 * Etsii seuraavan plan-stepin,
 * tarkistaa capabilityn ja muodostaa
 * Execution Enginelle turvallisen requestin.
 *
 * Riippuvuudet annetaan funktioina,
 * jotta moduuli pysyy erillisenä.
 */
async function advanceWorkflow({
  workflowId = null,

  getPlan,
  getNextReadyStep,
  canExecutePlanStep,
  createExecutionRequest,
  executePlanStep,
  executeTool,

  approvedByUser = false,

  input = null,
} = {}) {
  ensureInitialized()

  const id =
    sanitizeString(
      workflowId
    ) ||
    state.activeWorkflowId

  const workflow =
    getWorkflowReference(id)

  if (!workflow) {
    return {
      success: false,
      error:
        "Workflow not found",
    }
  }

  if (
    workflow.status !==
      WORKFLOW_STATUS.RUNNING
  ) {
    return {
      success: false,
      error:
        "Workflow is not running",
    }
  }

  const dependencies = {
    getPlan,
    getNextReadyStep,
    canExecutePlanStep,
    createExecutionRequest,
    executePlanStep,
    executeTool,
  }

  const missingFunction =
    Object.entries(
      dependencies
    ).find(
      ([, value]) =>
        typeof value !==
        "function"
    )

  if (missingFunction) {
    return {
      success: false,
      error:
        `Missing workflow dependency: ${missingFunction[0]}`,
    }
  }

  const plan =
    getPlan(
      workflow.planId
    )

  if (!plan) {
    return failWorkflow(
      workflow.id,
      "Associated plan not found"
    )
  }

  if (
    plan.status === "completed" ||
    plan.progress >= 1
  ) {
    return completeWorkflow(
      workflow.id
    )
  }

  const step =
    getNextReadyStep(
      workflow.planId
    )

  if (!step) {
    workflow.status =
      WORKFLOW_STATUS.PAUSED

    workflow.waiting = {
      type:
        "no-ready-step",

      reason:
        "Planning Engine returned no ready step.",

      since:
        new Date().toISOString(),
    }

    workflow.updatedAt =
      new Date().toISOString()

    touch()

    return {
      success: false,

      status:
        workflow.status,

      reason:
        "no-ready-step",

      workflow:
        clone(workflow),
    }
  }

  workflow.currentStepId =
    step.id

  state.counters
    .stepsRequested += 1

  /**
   * Käyttäjän hyväksyntä.
   */
  if (
    step.requiresApproval &&
    !step.approved &&
    !approvedByUser
  ) {
    workflow.status =
      WORKFLOW_STATUS
        .WAITING_APPROVAL

    workflow.waiting = {
      type:
        "user-approval",

      stepId:
        step.id,

      title:
        step.title,

      risk:
        step.risk,

      since:
        new Date().toISOString(),
    }

    state.counters
      .approvalsWaited += 1

    addHistory({
      action:
        "workflow-waiting-approval",

      workflowId:
        workflow.id,

      stepId:
        step.id,
    })

    touch()

    return {
      success: false,

      status:
        WORKFLOW_STATUS
          .WAITING_APPROVAL,

      reason:
        "user-approval-required",

      step:
        clone(step),

      workflow:
        clone(workflow),
    }
  }

  /**
   * Capability Registry.
   */
  const capabilityCheck =
    canExecutePlanStep({
      ...step,

      approved:
        Boolean(
          step.approved ||
          approvedByUser
        ),
    })

  if (
    !capabilityCheck ||
    capabilityCheck.allowed !==
      true
  ) {
    const reason =
      capabilityCheck
        ?.reason ||
      "capability-not-ready"

    workflow.status =
      reason.includes("tool")
        ? WORKFLOW_STATUS
            .WAITING_TOOL
        : WORKFLOW_STATUS
            .WAITING_CAPABILITY

    workflow.waiting = {
      type:
        workflow.status,

      stepId:
        step.id,

      capability:
        step.capability,

      tool:
        step.tool,

      reason,

      details:
        capabilityCheck ??
        null,

      since:
        new Date().toISOString(),
    }

    if (
      workflow.status ===
      WORKFLOW_STATUS
        .WAITING_TOOL
    ) {
      state.counters
        .toolsMissing += 1
    } else {
      state.counters
        .capabilitiesMissing += 1
    }

    addHistory({
      action:
        "workflow-capability-blocked",

      workflowId:
        workflow.id,

      stepId:
        step.id,

      reason,
    })

    touch()

    return {
      success: false,

      status:
        workflow.status,

      reason,

      capabilityCheck,

      workflow:
        clone(workflow),
    }
  }

  /**
   * Execution request.
   */
  const requestResult =
    createExecutionRequest({
      planId:
        workflow.planId,

      step,

      capabilityCheck,

      approvedByUser:
        Boolean(
          approvedByUser ||
          step.approved
        ),

      source:
        MODULE_ID,

      metadata: {
        workflowId:
          workflow.id,

        goalId:
          workflow.goalId,

        projectId:
          workflow.projectId,
      },
    })

  if (
    !requestResult ||
    requestResult.success !==
      true
  ) {
    return failWorkflow(
      workflow.id,
      requestResult?.error ||
        "execution-request-failed"
    )
  }

  workflow.waiting = null

  /**
   * Execution Engine.
   */
  const executionResult =
    await executePlanStep({
      execution:
        requestResult.execution,

      executeTool,

      input,
    })

  if (
    !executionResult ||
    executionResult.success !==
      true
  ) {
    workflow.status =
      executionResult?.status ===
      "blocked"
        ? WORKFLOW_STATUS.PAUSED
        : WORKFLOW_STATUS.FAILED

    workflow.waiting = {
      type:
        "execution",

      stepId:
        step.id,

      reason:
        executionResult?.reason ||
        "execution-failed",

      since:
        new Date().toISOString(),
    }

    if (
      workflow.status ===
      WORKFLOW_STATUS.FAILED
    ) {
      state.counters.failed += 1

      if (
        !workflow
          .failedStepIds
          .includes(step.id)
      ) {
        workflow
          .failedStepIds
          .push(step.id)
      }
    }

    addHistory({
      action:
        "workflow-step-failed",

      workflowId:
        workflow.id,

      stepId:
        step.id,

      reason:
        executionResult?.reason ||
        "execution-failed",
    })

    touch()

    return {
      success: false,

      status:
        workflow.status,

      execution:
        executionResult,

      workflow:
        clone(workflow),
    }
  }

  /**
   * HUOM:
   * Workflow Engine ei itse päivitä
   * Planning Enginen step-statusta.
   *
   * Caller/orchestrator tekee sen
   * Execution Resultin perusteella.
   */

  if (
    !workflow
      .completedStepIds
      .includes(step.id)
  ) {
    workflow
      .completedStepIds
      .push(step.id)
  }

  state.counters
    .stepsCompleted += 1

  workflow.currentStepId =
    null

  workflow.waiting = null

  calculateWorkflowProgress(
    workflow,
    plan
  )

  workflow.updatedAt =
    new Date().toISOString()

  addHistory({
    action:
      "workflow-step-executed",

    workflowId:
      workflow.id,

    stepId:
      step.id,

    progress:
      workflow.progress,
  })

  touch()

  return {
    success: true,

    status:
      "step-completed",

    step:
      clone(step),

    execution:
      executionResult,

    workflow:
      clone(workflow),
  }
}


/**
 * Jatkaa hyväksyntää odottavaa workflow'ta.
 */
function resumeAfterApproval(
  workflowId
) {
  ensureInitialized()

  const workflow =
    getWorkflowReference(
      workflowId
    )

  if (!workflow) {
    return {
      success: false,
      error:
        "Workflow not found",
    }
  }

  if (
    workflow.status !==
    WORKFLOW_STATUS
      .WAITING_APPROVAL
  ) {
    return {
      success: false,
      error:
        "Workflow is not waiting for approval",
    }
  }

  workflow.status =
    WORKFLOW_STATUS.RUNNING

  workflow.waiting = null

  workflow.updatedAt =
    new Date().toISOString()

  addHistory({
    action:
      "workflow-resumed-after-approval",

    workflowId:
      workflow.id,
  })

  touch()

  return {
    success: true,
    workflow:
      clone(workflow),
  }
}


/**
 * Pause.
 */
function pauseWorkflow(
  workflowId,
  reason = null
) {
  ensureInitialized()

  const workflow =
    getWorkflowReference(
      workflowId
    )

  if (!workflow) {
    return {
      success: false,
      error:
        "Workflow not found",
    }
  }

  workflow.status =
    WORKFLOW_STATUS.PAUSED

  workflow.waiting = {
    type:
      "manual-pause",

    reason:
      sanitizeString(reason),

    since:
      new Date().toISOString(),
  }

  workflow.updatedAt =
    new Date().toISOString()

  addHistory({
    action:
      "workflow-paused",

    workflowId:
      workflow.id,

    reason:
      sanitizeString(reason),
  })

  touch()

  return {
    success: true,
    workflow:
      clone(workflow),
  }
}


/**
 * Resume.
 */
function resumeWorkflow(
  workflowId
) {
  ensureInitialized()

  const workflow =
    getWorkflowReference(
      workflowId
    )

  if (!workflow) {
    return {
      success: false,
      error:
        "Workflow not found",
    }
  }

  if (
    [
      WORKFLOW_STATUS.COMPLETED,
      WORKFLOW_STATUS.CANCELLED,
    ].includes(
      workflow.status
    )
  ) {
    return {
      success: false,
      error:
        "Workflow cannot be resumed",
    }
  }

  workflow.status =
    WORKFLOW_STATUS.RUNNING

  workflow.waiting = null

  workflow.updatedAt =
    new Date().toISOString()

  state.activeWorkflowId =
    workflow.id

  addHistory({
    action:
      "workflow-resumed",

    workflowId:
      workflow.id,
  })

  touch()

  return {
    success: true,
    workflow:
      clone(workflow),
  }
}


/**
 * Complete.
 */
function completeWorkflow(
  workflowId
) {
  ensureInitialized()

  const workflow =
    getWorkflowReference(
      workflowId
    )

  if (!workflow) {
    return {
      success: false,
      error:
        "Workflow not found",
    }
  }

  const now =
    new Date().toISOString()

  workflow.status =
    WORKFLOW_STATUS.COMPLETED

  workflow.progress = 1

  workflow.currentStepId =
    null

  workflow.waiting = null

  workflow.completedAt = now
  workflow.updatedAt = now

  if (
    state.activeWorkflowId ===
    workflow.id
  ) {
    state.activeWorkflowId =
      null
  }

  state.counters.completed += 1

  addHistory({
    action:
      "workflow-completed",

    workflowId:
      workflow.id,
  })

  touch()

  return {
    success: true,
    workflow:
      clone(workflow),
  }
}


/**
 * Failed.
 */
function failWorkflow(
  workflowId,
  reason = null
) {
  ensureInitialized()

  const workflow =
    getWorkflowReference(
      workflowId
    )

  if (!workflow) {
    return {
      success: false,
      error:
        "Workflow not found",
    }
  }

  workflow.status =
    WORKFLOW_STATUS.FAILED

  workflow.waiting = {
    type:
      "failure",

    reason:
      sanitizeString(reason),

    since:
      new Date().toISOString(),
  }

  workflow.updatedAt =
    new Date().toISOString()

  state.counters.failed += 1

  addHistory({
    action:
      "workflow-failed",

    workflowId:
      workflow.id,

    reason:
      sanitizeString(reason),
  })

  touch()

  return {
    success: false,

    status:
      WORKFLOW_STATUS.FAILED,

    reason:
      sanitizeString(reason),

    workflow:
      clone(workflow),
  }
}


/**
 * Cancel.
 */
function cancelWorkflow(
  workflowId,
  reason = null
) {
  ensureInitialized()

  const workflow =
    getWorkflowReference(
      workflowId
    )

  if (!workflow) {
    return {
      success: false,
      error:
        "Workflow not found",
    }
  }

  workflow.status =
    WORKFLOW_STATUS.CANCELLED

  workflow.waiting = null

  workflow.cancelReason =
    sanitizeString(reason)

  workflow.updatedAt =
    new Date().toISOString()

  if (
    state.activeWorkflowId ===
    workflow.id
  ) {
    state.activeWorkflowId =
      null
  }

  state.counters.cancelled += 1

  addHistory({
    action:
      "workflow-cancelled",

    workflowId:
      workflow.id,

    reason:
      sanitizeString(reason),
  })

  touch()

  return {
    success: true,
    workflow:
      clone(workflow),
  }
}


/**
 * Hakee workflow'n.
 */
function getWorkflow(
  workflowId
) {
  ensureInitialized()

  const workflow =
    getWorkflowReference(
      workflowId
    )

  return workflow
    ? clone(workflow)
    : null
}


/**
 * Aktiivinen workflow.
 */
function getActiveWorkflow() {
  ensureInitialized()

  if (
    !state.activeWorkflowId
  ) {
    return null
  }

  return getWorkflow(
    state.activeWorkflowId
  )
}


/**
 * Listaus.
 */
function listWorkflows({
  status = null,
  projectId = null,
  goalId = null,
  limit = 100,
} = {}) {
  ensureInitialized()

  return [
    ...state.workflows.values(),
  ]
    .filter(
      (workflow) => {
        if (
          status &&
          workflow.status !==
            status
        ) {
          return false
        }

        if (
          projectId &&
          workflow.projectId !==
            projectId
        ) {
          return false
        }

        if (
          goalId &&
          workflow.goalId !==
            goalId
        ) {
          return false
        }

        return true
      }
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
 * Spacemonkeylle pieni workflow context.
 */
function getWorkflowContext() {
  ensureInitialized()

  const active =
    getActiveWorkflow()

  return {
    activeWorkflow:
      active,

    waiting:
      active?.waiting ??
      null,

    rule:
      "Run one validated workflow step at a time and stop whenever approval, capability or tool availability is required.",
  }
}


/**
 * Yhteenveto.
 */
function getWorkflowSummary() {
  ensureInitialized()

  const statuses = {}

  for (
    const status
    of Object.values(
      WORKFLOW_STATUS
    )
  ) {
    statuses[status] = 0
  }

  for (
    const workflow
    of state.workflows.values()
  ) {
    statuses[
      workflow.status
    ] += 1
  }

  return {
    workflows:
      state.workflows.size,

    activeWorkflowId:
      state.activeWorkflowId,

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
function getWorkflowHistory(
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
function getBoosterverseWorkflowEngineHealth() {
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
      getWorkflowSummary(),
  }
}


/**
 * Test-reset.
 */
function resetWorkflowEngine() {
  ensureInitialized()

  state.workflows.clear()

  state.activeWorkflowId =
    null

  state.history = []

  touch()

  return {
    success: true,
    status:
      "reset",
  }
}


/**
 * Progress lasketaan planin
 * step-määrän perusteella.
 */
function calculateWorkflowProgress(
  workflow,
  plan
) {
  if (
    !plan ||
    !Array.isArray(
      plan.steps
    ) ||
    plan.steps.length === 0
  ) {
    workflow.progress = 0
    return
  }

  workflow.progress =
    Math.min(
      1,
      workflow
        .completedStepIds
        .length /
        plan.steps.length
    )
}


function getWorkflowReference(
  workflowId
) {
  return state.workflows.get(
    sanitizeString(
      workflowId
    )
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
    initializeBoosterverseWorkflowEngine()
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

  WORKFLOW_STATUS,

  initializeBoosterverseWorkflowEngine,

  createWorkflow,

  startWorkflow,

  advanceWorkflow,

  resumeAfterApproval,

  pauseWorkflow,

  resumeWorkflow,

  completeWorkflow,

  failWorkflow,

  cancelWorkflow,

  getWorkflow,

  getActiveWorkflow,

  listWorkflows,

  getWorkflowContext,

  getWorkflowSummary,

  getWorkflowHistory,

  getBoosterverseWorkflowEngineHealth,

  resetWorkflowEngine,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Workflow Engine",

  version:
    MODULE_VERSION,

  description:
    "Boosterversen hallittu kokonaisen suunnitelman orkestrointi-, pysäytys- ja etenemiskerros.",

  initialize:
    initializeBoosterverseWorkflowEngine,

  createWorkflow,

  startWorkflow,

  advanceWorkflow,

  resumeAfterApproval,

  pauseWorkflow,

  resumeWorkflow,

  completeWorkflow,

  failWorkflow,

  cancelWorkflow,

  getWorkflow,

  getActiveWorkflow,

  listWorkflows,

  getWorkflowContext,

  getWorkflowSummary,

  getWorkflowHistory,

  health:
    getBoosterverseWorkflowEngineHealth,
}
