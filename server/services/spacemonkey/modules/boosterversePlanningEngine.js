/**
 * Wood-Booster HQ
 * Boosterverse Planning Engine
 *
 * Tarkoitus:
 * - muuttaa tavoite selkeäksi toimintasuunnitelmaksi
 * - pilkkoa tavoite pieniksi vaiheiksi
 * - määrittää vaiheiden järjestys ja riippuvuudet
 * - arvioida riskit ja hyväksyntätarpeet
 * - tarjota myöhemmälle Workflow Enginelle turvallinen suunnitelma
 *
 * Tämä moduuli EI:
 * - suorita tehtäviä
 * - kutsu työkaluja
 * - muuta projektidataa
 * - julkaise sisältöä
 * - lähetä viestejä
 * - kutsu LLM:ää
 *
 * Planning Engine suunnittelee.
 * Workflow Engine suorittaa myöhemmin.
 */

const MODULE_ID = "boosterverse-planning-engine"
const MODULE_VERSION = "1.0.0"

const PLAN_STATUS = Object.freeze({
  DRAFT: "draft",
  READY: "ready",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  FAILED: "failed",
})

const STEP_STATUS = Object.freeze({
  PENDING: "pending",
  READY: "ready",
  BLOCKED: "blocked",
  RUNNING: "running",
  COMPLETED: "completed",
  SKIPPED: "skipped",
  FAILED: "failed",
})

const RISK_LEVELS = Object.freeze({
  NONE: "none",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
})

const MAX_PLANS = 300
const MAX_STEPS_PER_PLAN = 100
const MAX_HISTORY = 300

const state = {
  initialized: false,
  startedAt: null,
  updatedAt: null,

  plans: new Map(),

  activePlanId: null,

  history: [],

  counters: {
    plansCreated: 0,
    stepsCreated: 0,
    plansActivated: 0,
    stepsCompleted: 0,
    blockedSteps: 0,
    approvalsRequired: 0,
  },
}


/**
 * Alustus.
 */
function initializeBoosterversePlanningEngine() {
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
 * Luo uuden suunnitelman.
 */
function createPlan({
  id = null,

  goalId = null,
  title = null,
  description = null,

  source = "goal-engine",

  projectId = null,
  customerId = null,

  constraints = [],

  metadata = null,
} = {}) {
  ensureInitialized()

  if (state.plans.size >= MAX_PLANS) {
    return {
      success: false,
      error: "Plan limit reached",
    }
  }

  const planId =
    sanitizeString(id) ||
    createId("bv-plan")

  if (state.plans.has(planId)) {
    return {
      success: false,
      error: `Plan already exists: ${planId}`,
    }
  }

  const now = new Date().toISOString()

  const plan = {
    id: planId,

    goalId:
      sanitizeString(goalId),

    title:
      sanitizeString(title) ||
      "Untitled plan",

    description:
      sanitizeString(description),

    source:
      sanitizeString(source),

    context: {
      projectId:
        sanitizeString(projectId),

      customerId:
        sanitizeString(customerId),
    },

    constraints:
      normalizeStrings(constraints),

    metadata,

    status:
      PLAN_STATUS.DRAFT,

    progress: 0,

    steps: [],

    createdAt: now,
    updatedAt: now,

    activatedAt: null,
    completedAt: null,
  }

  state.plans.set(
    planId,
    plan
  )

  state.counters.plansCreated += 1

  addHistory({
    action: "plan-created",
    planId,
    goalId: plan.goalId,
    title: plan.title,
  })

  touch()

  return {
    success: true,
    plan: clone(plan),
  }
}


/**
 * Luo suunnitelman Goal Enginen tavoitteesta.
 */
function createPlanFromGoal(
  goal,
  {
    title = null,
    description = null,
    steps = null,
    metadata = null,
  } = {}
) {
  ensureInitialized()

  if (
    !goal ||
    typeof goal !== "object"
  ) {
    return {
      success: false,
      error: "Valid goal is required",
    }
  }

  const result =
    createPlan({
      goalId:
        goal.id,

      title:
        title ||
        `Plan: ${goal.title || "Goal"}`,

      description:
        description ||
        goal.description ||
        null,

      projectId:
        goal.context
          ?.projectId ??
        null,

      customerId:
        goal.context
          ?.customerId ??
        null,

      constraints:
        goal.constraints || [],

      metadata: {
        ...(metadata || {}),

        goalType:
          goal.type ?? null,

        goalPriority:
          goal.priority ?? null,

        sourceIntent:
          goal.sourceIntent ?? null,
      },
    })

  if (!result.success) {
    return result
  }

  const planId =
    result.plan.id

  const templateSteps =
    Array.isArray(steps)
      ? steps
      : buildDefaultStepsForGoal(
          goal
        )

  for (const step of templateSteps) {
    addPlanStep(
      planId,
      step
    )
  }

  updatePlanReadiness(
    planId
  )

  return {
    success: true,
    plan:
      getPlan(planId),
  }
}


/**
 * Lisää suunnitelmaan vaiheen.
 */
function addPlanStep(
  planId,
  {
    id = null,

    title = null,
    description = null,

    type = "task",

    order = null,

    dependsOn = [],

    risk = RISK_LEVELS.LOW,

    requiresApproval = false,

    capability = null,
    tool = null,

    expectedOutput = null,

    metadata = null,
  } = {}
) {
  ensureInitialized()

  const plan =
    getPlanReference(planId)

  if (!plan) {
    return {
      success: false,
      error: "Plan not found",
    }
  }

  if (
    plan.steps.length >=
    MAX_STEPS_PER_PLAN
  ) {
    return {
      success: false,
      error:
        "Maximum number of plan steps reached",
    }
  }

  const stepId =
    sanitizeString(id) ||
    createId("bv-step")

  if (
    plan.steps.some(
      (step) =>
        step.id === stepId
    )
  ) {
    return {
      success: false,
      error:
        `Step already exists: ${stepId}`,
    }
  }

  const safeRisk =
    normalizeRiskLevel(risk)

  const approvalRequired =
    Boolean(
      requiresApproval
    ) ||
    riskRequiresApproval(
      safeRisk
    )

  const step = {
    id: stepId,

    title:
      sanitizeString(title) ||
      "Untitled step",

    description:
      sanitizeString(description),

    type:
      sanitizeString(type) ||
      "task",

    order:
      Number.isFinite(
        Number(order)
      )
        ? Number(order)
        : plan.steps.length,

    dependsOn:
      normalizeStrings(
        dependsOn
      ),

    risk:
      safeRisk,

    requiresApproval:
      approvalRequired,

    approved: false,

    capability:
      sanitizeString(
        capability
      ),

    tool:
      sanitizeString(tool),

    expectedOutput:
      sanitizeString(
        expectedOutput
      ),

    status:
      STEP_STATUS.PENDING,

    metadata,

    result: null,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

    startedAt: null,
    completedAt: null,
  }

  plan.steps.push(step)

  sortPlanSteps(plan)

  state.counters.stepsCreated += 1

  if (approvalRequired) {
    state.counters
      .approvalsRequired += 1
  }

  addHistory({
    action: "plan-step-added",
    planId: plan.id,
    stepId: step.id,
    title: step.title,
  })

  updatePlanReadiness(
    plan.id
  )

  touch()

  return {
    success: true,
    step: clone(step),
  }
}


/**
 * Aktivoi suunnitelman.
 */
function activatePlan(planId) {
  ensureInitialized()

  const plan =
    getPlanReference(planId)

  if (!plan) {
    return {
      success: false,
      error: "Plan not found",
    }
  }

  if (
    plan.status ===
    PLAN_STATUS.COMPLETED
  ) {
    return {
      success: false,
      error:
        "Completed plan cannot be activated",
    }
  }

  if (
    plan.status ===
    PLAN_STATUS.CANCELLED
  ) {
    return {
      success: false,
      error:
        "Cancelled plan cannot be activated",
    }
  }

  const previousPlanId =
    state.activePlanId

  if (
    previousPlanId &&
    previousPlanId !== plan.id
  ) {
    const previous =
      state.plans.get(
        previousPlanId
      )

    if (
      previous &&
      previous.status ===
        PLAN_STATUS.ACTIVE
    ) {
      previous.status =
        PLAN_STATUS.READY

      previous.updatedAt =
        new Date().toISOString()
    }
  }

  const now =
    new Date().toISOString()

  plan.status =
    PLAN_STATUS.ACTIVE

  plan.activatedAt =
    plan.activatedAt || now

  plan.updatedAt = now

  state.activePlanId =
    plan.id

  refreshStepStatuses(
    plan.id
  )

  state.counters
    .plansActivated += 1

  addHistory({
    action: "plan-activated",
    planId: plan.id,
    previousPlanId,
  })

  touch()

  return {
    success: true,
    plan: clone(plan),
  }
}


/**
 * Hyväksyy yksittäisen vaiheen.
 */
function approveStep(
  planId,
  stepId,
  {
    approvedByUser = false,
    note = null,
  } = {}
) {
  ensureInitialized()

  if (!approvedByUser) {
    return {
      success: false,
      error:
        "Step approval requires explicit user approval",
    }
  }

  const step =
    getStepReference(
      planId,
      stepId
    )

  if (!step) {
    return {
      success: false,
      error: "Plan step not found",
    }
  }

  step.approved = true

  step.approvalNote =
    sanitizeString(note)

  step.updatedAt =
    new Date().toISOString()

  refreshStepStatuses(
    planId
  )

  addHistory({
    action: "plan-step-approved",
    planId,
    stepId,
  })

  touch()

  return {
    success: true,
    step: clone(step),
  }
}


/**
 * Merkitsee vaiheen käynnissä olevaksi.
 *
 * Tätä käyttää myöhemmin Workflow Engine.
 */
function startStep(
  planId,
  stepId
) {
  ensureInitialized()

  const step =
    getStepReference(
      planId,
      stepId
    )

  if (!step) {
    return {
      success: false,
      error: "Plan step not found",
    }
  }

  const readiness =
    canStartStep(
      planId,
      stepId
    )

  if (!readiness.allowed) {
    return {
      success: false,
      error:
        readiness.reason,
    }
  }

  step.status =
    STEP_STATUS.RUNNING

  const now =
    new Date().toISOString()

  step.startedAt =
    step.startedAt || now

  step.updatedAt = now

  addHistory({
    action: "plan-step-started",
    planId,
    stepId,
  })

  touch()

  return {
    success: true,
    step: clone(step),
  }
}


/**
 * Valmis vaihe.
 */
function completeStep(
  planId,
  stepId,
  {
    result = null,
    note = null,
  } = {}
) {
  ensureInitialized()

  const plan =
    getPlanReference(planId)

  const step =
    getStepReference(
      planId,
      stepId
    )

  if (!plan || !step) {
    return {
      success: false,
      error: "Plan or step not found",
    }
  }

  const now =
    new Date().toISOString()

  step.status =
    STEP_STATUS.COMPLETED

  step.result =
    result ?? null

  step.note =
    sanitizeString(note)

  step.completedAt = now
  step.updatedAt = now

  state.counters
    .stepsCompleted += 1

  refreshStepStatuses(
    planId
  )

  recalculatePlanProgress(
    planId
  )

  addHistory({
    action:
      "plan-step-completed",

    planId,
    stepId,
  })

  if (
    plan.progress >= 1
  ) {
    completePlan(
      planId
    )
  }

  touch()

  return {
    success: true,
    step: clone(step),
    plan:
      clone(plan),
  }
}


/**
 * Ohittaa vaiheen.
 */
function skipStep(
  planId,
  stepId,
  reason = null
) {
  ensureInitialized()

  const step =
    getStepReference(
      planId,
      stepId
    )

  if (!step) {
    return {
      success: false,
      error: "Plan step not found",
    }
  }

  step.status =
    STEP_STATUS.SKIPPED

  step.skipReason =
    sanitizeString(reason)

  step.completedAt =
    new Date().toISOString()

  step.updatedAt =
    new Date().toISOString()

  refreshStepStatuses(
    planId
  )

  recalculatePlanProgress(
    planId
  )

  addHistory({
    action: "plan-step-skipped",
    planId,
    stepId,
    reason:
      sanitizeString(reason),
  })

  touch()

  return {
    success: true,
    step: clone(step),
  }
}


/**
 * Merkitsee vaiheen epäonnistuneeksi.
 */
function failStep(
  planId,
  stepId,
  reason = null
) {
  ensureInitialized()

  const step =
    getStepReference(
      planId,
      stepId
    )

  if (!step) {
    return {
      success: false,
      error: "Plan step not found",
    }
  }

  step.status =
    STEP_STATUS.FAILED

  step.failureReason =
    sanitizeString(reason)

  step.updatedAt =
    new Date().toISOString()

  addHistory({
    action: "plan-step-failed",
    planId,
    stepId,
    reason:
      sanitizeString(reason),
  })

  touch()

  return {
    success: true,
    step: clone(step),
  }
}


/**
 * Tarkistaa saako vaihe alkaa.
 */
function canStartStep(
  planId,
  stepId
) {
  ensureInitialized()

  const plan =
    getPlanReference(planId)

  const step =
    getStepReference(
      planId,
      stepId
    )

  if (!plan || !step) {
    return {
      allowed: false,
      reason:
        "Plan or step not found",
    }
  }

  if (
    step.status ===
    STEP_STATUS.COMPLETED
  ) {
    return {
      allowed: false,
      reason:
        "Step is already completed",
    }
  }

  if (
    step.requiresApproval &&
    !step.approved
  ) {
    return {
      allowed: false,
      reason:
        "Step requires user approval",
    }
  }

  for (
    const dependencyId
    of step.dependsOn
  ) {
    const dependency =
      plan.steps.find(
        (item) =>
          item.id ===
          dependencyId
      )

    if (!dependency) {
      return {
        allowed: false,
        reason:
          `Missing dependency: ${dependencyId}`,
      }
    }

    if (
      dependency.status !==
        STEP_STATUS.COMPLETED &&
      dependency.status !==
        STEP_STATUS.SKIPPED
    ) {
      return {
        allowed: false,
        reason:
          `Dependency not completed: ${dependencyId}`,
      }
    }
  }

  return {
    allowed: true,
    reason: "ready",
  }
}


/**
 * Seuraava suoritettava vaihe.
 */
function getNextReadyStep(
  planId
) {
  ensureInitialized()

  refreshStepStatuses(
    planId
  )

  const plan =
    getPlanReference(planId)

  if (!plan) {
    return null
  }

  const step =
    plan.steps.find(
      (item) =>
        item.status ===
        STEP_STATUS.READY
    )

  return step
    ? clone(step)
    : null
}


/**
 * Palauttaa suunnitelman.
 */
function getPlan(planId) {
  ensureInitialized()

  const plan =
    getPlanReference(planId)

  return plan
    ? clone(plan)
    : null
}


/**
 * Aktiivinen suunnitelma.
 */
function getActivePlan() {
  ensureInitialized()

  if (!state.activePlanId) {
    return null
  }

  return getPlan(
    state.activePlanId
  )
}


/**
 * Listaa suunnitelmat.
 */
function listPlans({
  status = null,
  goalId = null,
  projectId = null,
  limit = 100,
} = {}) {
  ensureInitialized()

  return [
    ...state.plans.values(),
  ]
    .filter((plan) => {
      if (
        status &&
        plan.status !== status
      ) {
        return false
      }

      if (
        goalId &&
        plan.goalId !== goalId
      ) {
        return false
      }

      if (
        projectId &&
        plan.context
          .projectId !==
          projectId
      ) {
        return false
      }

      return true
    })
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
 * Planning Context Spacemonkeylle.
 */
function getPlanningContext() {
  ensureInitialized()

  const activePlan =
    getActivePlan()

  return {
    activePlan,

    nextStep:
      activePlan
        ? getNextReadyStep(
            activePlan.id
          )
        : null,

    guidance:
      buildPlanningGuidance(
        activePlan
      ),
  }
}


/**
 * Yhteenveto.
 */
function getPlanningSummary() {
  ensureInitialized()

  const statuses = {}

  for (
    const plan
    of state.plans.values()
  ) {
    statuses[
      plan.status
    ] =
      (statuses[
        plan.status
      ] || 0) + 1
  }

  return {
    totalPlans:
      state.plans.size,

    activePlanId:
      state.activePlanId,

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
function getPlanningHistory(
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
function getBoosterversePlanningEngineHealth() {
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
      getPlanningSummary(),
  }
}


/**
 * Runtime reset testeihin.
 */
function resetPlanningEngine() {
  ensureInitialized()

  state.plans.clear()

  state.activePlanId = null

  state.history = []

  touch()

  return {
    success: true,
    status: "reset",
  }
}


/**
 * Suunnitelma valmiiksi.
 */
function completePlan(
  planId
) {
  const plan =
    getPlanReference(planId)

  if (!plan) {
    return
  }

  const now =
    new Date().toISOString()

  plan.status =
    PLAN_STATUS.COMPLETED

  plan.progress = 1

  plan.completedAt = now
  plan.updatedAt = now

  if (
    state.activePlanId ===
    plan.id
  ) {
    state.activePlanId = null
  }

  addHistory({
    action: "plan-completed",
    planId,
  })
}


/**
 * Päivittää planin ready-tilan.
 */
function updatePlanReadiness(
  planId
) {
  const plan =
    getPlanReference(planId)

  if (!plan) {
    return
  }

  if (
    plan.steps.length === 0
  ) {
    plan.status =
      PLAN_STATUS.DRAFT

    return
  }

  if (
    plan.status ===
    PLAN_STATUS.DRAFT
  ) {
    plan.status =
      PLAN_STATUS.READY
  }

  refreshStepStatuses(
    planId
  )

  plan.updatedAt =
    new Date().toISOString()
}


/**
 * Päivittää step-status riippuvuuksien
 * ja hyväksyntöjen perusteella.
 */
function refreshStepStatuses(
  planId
) {
  const plan =
    getPlanReference(planId)

  if (!plan) {
    return
  }

  for (
    const step
    of plan.steps
  ) {
    if (
      [
        STEP_STATUS.RUNNING,
        STEP_STATUS.COMPLETED,
        STEP_STATUS.SKIPPED,
        STEP_STATUS.FAILED,
      ].includes(
        step.status
      )
    ) {
      continue
    }

    const readiness =
      canStartStep(
        planId,
        step.id
      )

    if (readiness.allowed) {
      step.status =
        STEP_STATUS.READY
    } else {
      step.status =
        STEP_STATUS.BLOCKED

      state.counters
        .blockedSteps += 1
    }

    step.updatedAt =
      new Date().toISOString()
  }
}


/**
 * Laskee plan progressin.
 */
function recalculatePlanProgress(
  planId
) {
  const plan =
    getPlanReference(planId)

  if (
    !plan ||
    plan.steps.length === 0
  ) {
    return
  }

  const finished =
    plan.steps.filter(
      (step) =>
        step.status ===
          STEP_STATUS.COMPLETED ||
        step.status ===
          STEP_STATUS.SKIPPED
    ).length

  plan.progress =
    clampNumber(
      finished /
        plan.steps.length,
      0,
      1
    )

  plan.updatedAt =
    new Date().toISOString()
}


/**
 * Oletussuunnitelma goal-tyypin perusteella.
 *
 * Tämä on tarkoituksella yksinkertainen.
 * LLM-pohjainen suunnittelu voidaan lisätä myöhemmin.
 */
function buildDefaultStepsForGoal(
  goal
) {
  const type =
    sanitizeString(
      goal.type
    ) || "general"

  switch (type) {
    case "create-quote":
      return [
        {
          title:
            "Load project data",

          type:
            "read",

          risk:
            RISK_LEVELS.NONE,

          capability:
            "project-data",

          expectedOutput:
            "Current project information",
        },

        {
          title:
            "Review materials and costs",

          type:
            "analysis",

          risk:
            RISK_LEVELS.LOW,

          capability:
            "pricing",

          expectedOutput:
            "Verified cost basis",
        },

        {
          title:
            "Prepare quote draft",

          type:
            "prepare",

          risk:
            RISK_LEVELS.LOW,

          capability:
            "quote-generation",

          expectedOutput:
            "Quote draft",
        },

        {
          title:
            "Request user approval",

          type:
            "approval",

          risk:
            RISK_LEVELS.MEDIUM,

          requiresApproval:
            true,

          expectedOutput:
            "User-approved quote",
        },
      ]

    case "edit-media":
      return [
        {
          title:
            "Load project media",

          type:
            "read",

          risk:
            RISK_LEVELS.NONE,

          capability:
            "media",
        },

        {
          title:
            "Analyze media",

          type:
            "analysis",

          risk:
            RISK_LEVELS.LOW,

          capability:
            "media-analysis",
        },

        {
          title:
            "Prepare media output",

          type:
            "prepare",

          risk:
            RISK_LEVELS.LOW,

          capability:
            "media-editing",
        },
      ]

    case "prepare-social":
      return [
        {
          title:
            "Load verified project information",

          type:
            "read",

          risk:
            RISK_LEVELS.NONE,

          capability:
            "project-data",
        },

        {
          title:
            "Prepare social media draft",

          type:
            "prepare",

          risk:
            RISK_LEVELS.LOW,

          capability:
            "social-content",
        },

        {
          title:
            "Request publication approval",

          type:
            "approval",

          risk:
            RISK_LEVELS.HIGH,

          requiresApproval:
            true,

          capability:
            "social-publishing",
        },
      ]

    case "manage-materials":
    case "check-inventory":
      return [
        {
          title:
            "Load inventory data",

          type:
            "read",

          risk:
            RISK_LEVELS.NONE,

          capability:
            "inventory",
        },

        {
          title:
            "Compare material requirements",

          type:
            "analysis",

          risk:
            RISK_LEVELS.LOW,

          capability:
            "materials",
        },

        {
          title:
            "Prepare material recommendation",

          type:
            "prepare",

          risk:
            RISK_LEVELS.LOW,

          capability:
            "materials",
        },
      ]

    default:
      return [
        {
          title:
            goal.title ||
            "Review goal",

          type:
            "analysis",

          risk:
            RISK_LEVELS.LOW,

          capability:
            "general-reasoning",

          expectedOutput:
            "Clear next action",
        },
      ]
  }
}


/**
 * Guidance.
 */
function buildPlanningGuidance(
  activePlan
) {
  if (!activePlan) {
    return {
      type:
        "no-active-plan",

      message:
        "No active plan is currently selected.",
    }
  }

  const nextStep =
    getNextReadyStep(
      activePlan.id
    )

  if (!nextStep) {
    return {
      type:
        "no-ready-step",

      message:
        "No plan step is currently ready to run.",
    }
  }

  if (
    nextStep.requiresApproval &&
    !nextStep.approved
  ) {
    return {
      type:
        "approval-required",

      message:
        "The next step requires user approval.",
    }
  }

  return {
    type:
      "next-step-ready",

    message:
      nextStep.title,
  }
}


/**
 * Risk.
 */
function normalizeRiskLevel(
  risk
) {
  const safe =
    sanitizeString(risk)

  const values =
    Object.values(
      RISK_LEVELS
    )

  return values.includes(safe)
    ? safe
    : RISK_LEVELS.LOW
}


function riskRequiresApproval(
  risk
) {
  return [
    RISK_LEVELS.HIGH,
    RISK_LEVELS.CRITICAL,
  ].includes(
    normalizeRiskLevel(
      risk
    )
  )
}


function getPlanReference(
  planId
) {
  return state.plans.get(
    sanitizeString(planId)
  )
}


function getStepReference(
  planId,
  stepId
) {
  const plan =
    getPlanReference(planId)

  if (!plan) {
    return null
  }

  return (
    plan.steps.find(
      (step) =>
        step.id ===
        sanitizeString(stepId)
    ) || null
  )
}


function sortPlanSteps(plan) {
  plan.steps.sort(
    (a, b) =>
      a.order - b.order
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
    initializeBoosterversePlanningEngine()
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

  PLAN_STATUS,
  STEP_STATUS,
  RISK_LEVELS,

  initializeBoosterversePlanningEngine,

  createPlan,

  createPlanFromGoal,

  addPlanStep,

  activatePlan,

  approveStep,

  startStep,

  completeStep,

  skipStep,

  failStep,

  canStartStep,

  getNextReadyStep,

  getPlan,

  getActivePlan,

  listPlans,

  getPlanningContext,

  getPlanningSummary,

  getPlanningHistory,

  getBoosterversePlanningEngineHealth,

  resetPlanningEngine,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Planning Engine",

  version:
    MODULE_VERSION,

  description:
    "Boosterversen turvallinen tavoitteen pilkkomis-, riskiluokittelu- ja vaiheistussuunnittelun kerros.",

  initialize:
    initializeBoosterversePlanningEngine,

  createPlan,

  createPlanFromGoal,

  addPlanStep,

  activatePlan,

  approveStep,

  startStep,

  completeStep,

  skipStep,

  failStep,

  canStartStep,

  getNextReadyStep,

  getPlan,

  getActivePlan,

  listPlans,

  getPlanningContext,

  getPlanningSummary,

  getPlanningHistory,

  health:
    getBoosterversePlanningEngineHealth,
}
