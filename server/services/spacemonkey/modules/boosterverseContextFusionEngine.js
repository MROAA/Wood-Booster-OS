/**
 * Wood-Booster HQ
 * Boosterverse Context Fusion Engine
 *
 * Spacemonkeyn reaaliaikaisen kontekstin yhdistämiskerros.
 *
 * Tarkoitus:
 * - yhdistää Boosterverse-moduulien tieto yhteen
 * - valita vain nykytilanteessa relevantti tieto
 * - estää AI-contextin hallitsematon kasvaminen
 * - priorisoida tärkein tieto
 * - muodostaa pieni live-context Qwen/LLM-käyttöön
 * - säilyttää Reality First -periaate
 *
 * Tämä moduuli EI:
 * - kutsu LLM:ää
 * - kirjoita muistia
 * - muuta Canon-tietoa
 * - suorita automaatioita
 * - tee päätöksiä käyttäjän puolesta
 * - seuraa käyttäjää Wood-Booster HQ:n ulkopuolella
 *
 * Perusketju:
 *
 * World State
 *      +
 * Attention
 *      +
 * Focus
 *      +
 * Cognitive Load
 *      +
 * Intent
 *      +
 * Goals
 *      +
 * Planning
 *      +
 * Workflow
 *      +
 * Execution
 *      +
 * Memory
 *      +
 * Knowledge
 *      +
 * Capabilities
 *
 *      ↓
 *
 * Context Fusion
 *
 *      ↓
 *
 * Small Relevant Live Context
 */

const MODULE_ID =
  "boosterverse-context-fusion-engine"

const MODULE_VERSION =
  "1.0.0"

const CONTEXT_LEVELS =
  Object.freeze({
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    BACKGROUND: "background",
  })

const CONTEXT_SOURCES =
  Object.freeze({
    WORLD: "world",
    ATTENTION: "attention",
    FOCUS: "focus",
    COGNITIVE_LOAD: "cognitive-load",
    INTENT: "intent",
    GOAL: "goal",
    PLANNING: "planning",
    WORKFLOW: "workflow",
    EXECUTION: "execution",
    MEMORY: "memory",
    KNOWLEDGE: "knowledge",
    CAPABILITIES: "capabilities",
    TOOLS: "tools",
    IDENTITY: "identity",
    HEALTH: "health",
  })

const DEFAULT_LIMITS =
  Object.freeze({
    maxItems: 40,
    maxMemories: 8,
    maxKnowledge: 8,
    maxEvents: 8,
    maxGoals: 5,
    maxCapabilities: 20,
    maxApproxCharacters: 14000,
  })

const DEFAULT_SOURCE_WEIGHTS =
  Object.freeze({
    world: 1.0,
    attention: 1.0,
    focus: 1.0,
    "cognitive-load": 0.95,
    intent: 0.95,
    goal: 0.9,
    planning: 0.85,
    workflow: 0.9,
    execution: 0.9,
    memory: 0.7,
    knowledge: 0.75,
    capabilities: 0.65,
    tools: 0.55,
    identity: 0.8,
    health: 0.7,
  })

const state = {
  initialized: false,

  startedAt: null,
  updatedAt: null,

  latestContext: null,

  providers: new Map(),

  history: [],

  counters: {
    contextsBuilt: 0,
    providersRegistered: 0,
    providerErrors: 0,
    itemsConsidered: 0,
    itemsIncluded: 0,
    itemsDropped: 0,
    contextsTrimmed: 0,
  },
}

const MAX_HISTORY = 200


/**
 * Alustus.
 */
function initializeBoosterverseContextFusionEngine() {
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
 * Rekisteröi context-providerin.
 *
 * Provider pidetään dependency injection
 * -mallilla erillisenä moduulina.
 *
 * Esimerkki:
 *
 * registerContextProvider({
 *   id: "world",
 *   getter: () => worldState.getLiveContext()
 * })
 */
function registerContextProvider({
  id,
  getter,
  enabled = true,
  weight = null,
  description = null,
} = {}) {
  ensureInitialized()

  const providerId =
    normalizeSource(id)

  if (!providerId) {
    return {
      success: false,
      error:
        "Context provider id is required",
    }
  }

  if (
    typeof getter !==
    "function"
  ) {
    return {
      success: false,
      error:
        "Context provider getter must be a function",
    }
  }

  const existing =
    state.providers.get(
      providerId
    )

  const now =
    new Date().toISOString()

  const provider = {
    id:
      providerId,

    getter,

    enabled:
      Boolean(enabled),

    weight:
      weight === null
        ? getDefaultSourceWeight(
            providerId
          )
        : clampNumber(
            weight,
            0,
            2
          ),

    description:
      sanitizeString(
        description
      ),

    calls:
      existing?.calls ??
      0,

    failures:
      existing?.failures ??
      0,

    lastCallAt:
      existing?.lastCallAt ??
      null,

    lastError:
      null,

    createdAt:
      existing?.createdAt ??
      now,

    updatedAt:
      now,
  }

  state.providers.set(
    providerId,
    provider
  )

  if (!existing) {
    state.counters
      .providersRegistered += 1
  }

  addHistory({
    action:
      "context-provider-registered",

    providerId,

    enabled:
      provider.enabled,
  })

  touch()

  return {
    success: true,

    created:
      !Boolean(existing),

    provider:
      serializeProvider(
        provider
      ),
  }
}


/**
 * Provider päälle/pois.
 */
function setContextProviderEnabled(
  providerId,
  enabled
) {
  ensureInitialized()

  const provider =
    state.providers.get(
      normalizeSource(
        providerId
      )
    )

  if (!provider) {
    return {
      success: false,
      error:
        "Context provider not found",
    }
  }

  provider.enabled =
    Boolean(enabled)

  provider.updatedAt =
    new Date().toISOString()

  touch()

  return {
    success: true,

    provider:
      serializeProvider(
        provider
      ),
  }
}


/**
 * Rakentaa koko fused-contextin
 * rekisteröidyistä providereista.
 */
async function buildContext({
  limits = null,
  additionalContext = null,
} = {}) {
  ensureInitialized()

  const safeLimits =
    normalizeLimits(
      limits
    )

  const providerData =
    await collectProviderData()

  return buildContextFromSources({
    ...providerData,

    additionalContext,

    limits:
      safeLimits,
  })
}


/**
 * Rakentaa contextin suoraan annetuista
 * lähteistä.
 *
 * Tätä on helppo käyttää testeissä.
 */
function buildContextFromSources({
  world = null,
  attention = null,
  focus = null,
  cognitiveLoad = null,
  intent = null,
  goal = null,
  planning = null,
  workflow = null,
  execution = null,
  memory = null,
  knowledge = null,
  capabilities = null,
  tools = null,
  identity = null,
  health = null,

  additionalContext = null,

  limits = null,
} = {}) {
  ensureInitialized()

  const safeLimits =
    normalizeLimits(
      limits
    )

  const candidates = []

  addWorldCandidates(
    candidates,
    world
  )

  addAttentionCandidates(
    candidates,
    attention
  )

  addFocusCandidates(
    candidates,
    focus
  )

  addCognitiveLoadCandidates(
    candidates,
    cognitiveLoad
  )

  addIntentCandidates(
    candidates,
    intent
  )

  addGoalCandidates(
    candidates,
    goal
  )

  addPlanningCandidates(
    candidates,
    planning
  )

  addWorkflowCandidates(
    candidates,
    workflow
  )

  addExecutionCandidates(
    candidates,
    execution
  )

  addMemoryCandidates(
    candidates,
    memory,
    safeLimits.maxMemories
  )

  addKnowledgeCandidates(
    candidates,
    knowledge,
    safeLimits.maxKnowledge
  )

  addCapabilityCandidates(
    candidates,
    capabilities,
    safeLimits.maxCapabilities
  )

  addToolCandidates(
    candidates,
    tools
  )

  addIdentityCandidates(
    candidates,
    identity
  )

  addHealthCandidates(
    candidates,
    health
  )

  if (
    additionalContext !== null &&
    additionalContext !== undefined
  ) {
    candidates.push(
      createContextItem({
        source:
          "additional",

        type:
          "additional-context",

        value:
          additionalContext,

        relevance:
          0.5,

        confidence:
          0.7,

        level:
          CONTEXT_LEVELS.MEDIUM,
      })
    )
  }

  state.counters
    .itemsConsidered +=
    candidates.length

  const ranked =
    rankContextItems(
      candidates
    )

  const selected =
    selectContextItems(
      ranked,
      safeLimits
    )

  const now =
    new Date().toISOString()

  const fused = {
    id:
      createId(
        "bv-context"
      ),

    timestamp:
      now,

    primary:
      buildPrimaryContext({
        world,
        attention,
        focus,
        cognitiveLoad,
        intent,
        goal,
        planning,
        workflow,
        execution,
      }),

    contextItems:
      selected.items,

    relevantMemory:
      selected.items
        .filter(
          (item) =>
            item.source ===
            CONTEXT_SOURCES.MEMORY
        )
        .map(
          (item) =>
            item.value
        ),

    relevantKnowledge:
      selected.items
        .filter(
          (item) =>
            item.source ===
            CONTEXT_SOURCES.KNOWLEDGE
        )
        .map(
          (item) =>
            item.value
        ),

    capabilities:
      simplifyCapabilities(
        capabilities
      ),

    systemHealth:
      simplifyHealth(
        health
      ),

    metrics: {
      considered:
        candidates.length,

      included:
        selected.items.length,

      dropped:
        candidates.length -
        selected.items.length,

      approximateCharacters:
        selected
          .approximateCharacters,

      trimmed:
        selected.trimmed,
    },

    rules: [
      "Treat inferred intent as an estimate, not a fact.",
      "Do not present uncertain memory as verified knowledge.",
      "Prefer current project and current task over historical context.",
      "Never claim an unavailable capability.",
      "Reduce visible complexity when cognitive load is high.",
      "Use Reality First: unknown information must remain unknown.",
    ],
  }

  state.latestContext =
    fused

  state.counters
    .contextsBuilt += 1

  state.counters
    .itemsIncluded +=
    selected.items.length

  state.counters
    .itemsDropped +=
    Math.max(
      0,
      candidates.length -
      selected.items.length
    )

  if (selected.trimmed) {
    state.counters
      .contextsTrimmed += 1
  }

  addHistory({
    action:
      "context-built",

    contextId:
      fused.id,

    included:
      selected.items.length,

    dropped:
      fused.metrics.dropped,

    approximateCharacters:
      fused.metrics
        .approximateCharacters,
  })

  touch()

  return {
    success: true,
    context:
      clone(fused),
  }
}


/**
 * AI:lle tarkoitettu vielä pienempi
 * live-context.
 */
function getLiveContext() {
  ensureInitialized()

  if (!state.latestContext) {
    return null
  }

  const context =
    state.latestContext

  return clone({
    timestamp:
      context.timestamp,

    primary:
      context.primary,

    relevantMemory:
      context.relevantMemory,

    relevantKnowledge:
      context.relevantKnowledge,

    capabilities:
      context.capabilities,

    systemHealth:
      context.systemHealth,

    rules:
      context.rules,
  })
}


/**
 * Palauttaa viimeisen koko contextin.
 */
function getLatestContext() {
  ensureInitialized()

  return state.latestContext
    ? clone(
        state.latestContext
      )
    : null
}


/**
 * Rakentaa AI:lle tekstimuotoisen
 * context blockin.
 *
 * Tämä helpottaa myöhempää injektiota
 * Qwen/system-promptiin.
 */
function buildContextText(
  context =
    state.latestContext
) {
  ensureInitialized()

  if (!context) {
    return ""
  }

  const lines = []

  lines.push(
    "BOOSTERVERSE LIVE CONTEXT"
  )

  lines.push(
    `Timestamp: ${
      context.timestamp ||
      new Date().toISOString()
    }`
  )

  const primary =
    context.primary ||
    {}

  if (primary.page) {
    lines.push(
      `Current page: ${primary.page}`
    )
  }

  if (primary.project) {
    lines.push(
      `Current project: ${
        formatEntity(
          primary.project
        )
      }`
    )
  }

  if (primary.customer) {
    lines.push(
      `Current customer: ${
        formatEntity(
          primary.customer
        )
      }`
    )
  }

  if (primary.task) {
    lines.push(
      `Current task: ${
        formatEntity(
          primary.task
        )
      }`
    )
  }

  if (primary.attention) {
    lines.push(
      `Attention: ${
        formatEntity(
          primary.attention
        )
      }`
    )
  }

  if (primary.focus) {
    lines.push(
      `Focus: ${
        formatEntity(
          primary.focus
        )
      }`
    )
  }

  if (primary.intent?.type) {
    lines.push(
      `Intent estimate: ${primary.intent.type} (${formatPercent(
        primary.intent
          .confidence
      )})`
    )
  }

  if (primary.goal) {
    lines.push(
      `Active goal: ${
        primary.goal.title ||
        primary.goal.id ||
        "unknown"
      }`
    )
  }

  if (primary.workflow) {
    lines.push(
      `Workflow: ${
        primary.workflow.title ||
        primary.workflow.id ||
        primary.workflow.status ||
        "active"
      }`
    )
  }

  if (
    primary.cognitiveLoad
      ?.level
  ) {
    lines.push(
      `System cognitive load: ${
        primary
          .cognitiveLoad
          .level
      }`
    )
  }

  if (
    Array.isArray(
      context.relevantMemory
    ) &&
    context.relevantMemory
      .length > 0
  ) {
    lines.push(
      "Relevant memory:"
    )

    for (
      const memory
      of context.relevantMemory
    ) {
      lines.push(
        `- ${formatValue(
          memory
        )}`
      )
    }
  }

  if (
    Array.isArray(
      context.relevantKnowledge
    ) &&
    context.relevantKnowledge
      .length > 0
  ) {
    lines.push(
      "Relevant knowledge:"
    )

    for (
      const item
      of context
        .relevantKnowledge
    ) {
      lines.push(
        `- ${formatValue(
          item
        )}`
      )
    }
  }

  lines.push(
    "Reality First: do not invent missing information."
  )

  return lines.join("\n")
}


/**
 * Providerien data.
 */
async function collectProviderData() {
  const result = {}

  for (
    const [
      providerId,
      provider,
    ]
    of state.providers.entries()
  ) {
    if (!provider.enabled) {
      continue
    }

    provider.calls += 1
    provider.lastCallAt =
      new Date().toISOString()

    try {
      const value =
        await provider.getter()

      result[
        providerId
      ] = value

      provider.lastError = null
    } catch (error) {
      provider.failures += 1

      provider.lastError =
        sanitizeString(
          error?.message
        ) ||
        "context-provider-error"

      state.counters
        .providerErrors += 1

      result[
        providerId
      ] = null
    }
  }

  return result
}


/**
 * Primary Context =
 * tämän hetken tärkeimmät asiat.
 */
function buildPrimaryContext({
  world,
  attention,
  focus,
  cognitiveLoad,
  intent,
  goal,
  planning,
  workflow,
  execution,
}) {
  const activeProject =
    world?.project ??
    world?.context
      ?.activeProject ??
    null

  const activeCustomer =
    world?.customer ??
    world?.context
      ?.activeCustomer ??
    null

  const activeTask =
    world?.task ??
    world?.context
      ?.activeTask ??
    null

  const activePage =
    world?.page ??
    world?.navigation
      ?.activePage ??
    null

  const currentAttention =
    attention?.current ??
    attention
      ?.currentAttention ??
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

  const activePlanning =
    planning?.activePlan ??
    null

  const activeWorkflow =
    workflow
      ?.activeWorkflow ??
    null

  const currentExecution =
    execution
      ?.currentExecution ??
    null

  const currentLoad =
    cognitiveLoad
      ?.current ??
    cognitiveLoad ??
    null

  return {
    page:
      activePage,

    project:
      cloneSafe(
        activeProject
      ),

    customer:
      cloneSafe(
        activeCustomer
      ),

    task:
      cloneSafe(
        activeTask
      ),

    attention:
      cloneSafe(
        currentAttention
      ),

    focus:
      cloneSafe(
        primaryFocus
      ),

    intent:
      cloneSafe(
        currentIntent
      ),

    goal:
      cloneSafe(
        activeGoal
      ),

    plan:
      cloneSafe(
        activePlanning
      ),

    workflow:
      cloneSafe(
        activeWorkflow
      ),

    execution:
      cloneSafe(
        currentExecution
      ),

    cognitiveLoad:
      cloneSafe(
        currentLoad
      ),
  }
}


/**
 * World candidates.
 */
function addWorldCandidates(
  candidates,
  world
) {
  if (!world) {
    return
  }

  const project =
    world.project ??
    world.context
      ?.activeProject

  const customer =
    world.customer ??
    world.context
      ?.activeCustomer

  const task =
    world.task ??
    world.context
      ?.activeTask

  const workflow =
    world.workflow ??
    world.context
      ?.activeWorkflow

  const page =
    world.page ??
    world.navigation
      ?.activePage

  const tool =
    world.tool ??
    world.context
      ?.activeTool

  if (project) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.WORLD,

        type:
          "current-project",

        value:
          project,

        relevance: 1,

        confidence: 1,

        level:
          CONTEXT_LEVELS.CRITICAL,
      })
    )
  }

  if (task) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.WORLD,

        type:
          "current-task",

        value:
          task,

        relevance: 0.98,

        confidence: 1,

        level:
          CONTEXT_LEVELS.CRITICAL,
      })
    )
  }

  if (page) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.WORLD,

        type:
          "current-page",

        value:
          page,

        relevance: 0.9,

        confidence: 1,

        level:
          CONTEXT_LEVELS.HIGH,
      })
    )
  }

  if (customer) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.WORLD,

        type:
          "current-customer",

        value:
          customer,

        relevance: 0.75,

        confidence: 1,

        level:
          CONTEXT_LEVELS.HIGH,
      })
    )
  }

  if (workflow) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.WORLD,

        type:
          "current-workflow",

        value:
          workflow,

        relevance: 0.85,

        confidence: 1,

        level:
          CONTEXT_LEVELS.HIGH,
      })
    )
  }

  if (tool) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.WORLD,

        type:
          "current-tool",

        value:
          tool,

        relevance: 0.7,

        confidence: 1,

        level:
          CONTEXT_LEVELS.MEDIUM,
      })
    )
  }

  const events =
    Array.isArray(
      world.recentEvents
    )
      ? world.recentEvents
      : []

  for (
    const event
    of events.slice(-8)
  ) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.WORLD,

        type:
          "recent-event",

        value:
          event,

        relevance:
          clampNumber(
            event?.importance ??
            0.5,
            0,
            1
          ),

        confidence:
          clampNumber(
            event?.confidence ??
            1,
            0,
            1
          ),

        level:
          CONTEXT_LEVELS.MEDIUM,
      })
    )
  }
}


/**
 * Attention candidates.
 */
function addAttentionCandidates(
  candidates,
  attention
) {
  if (!attention) {
    return
  }

  const current =
    attention.current ??
    attention
      .currentAttention

  if (current) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.ATTENTION,

        type:
          "current-attention",

        value:
          current,

        relevance: 1,

        confidence:
          clampNumber(
            current.confidence ??
            1,
            0,
            1
          ),

        level:
          CONTEXT_LEVELS.CRITICAL,
      })
    )
  }

  if (attention.state) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.ATTENTION,

        type:
          "attention-state",

        value:
          attention.state,

        relevance: 0.75,

        confidence: 1,

        level:
          CONTEXT_LEVELS.HIGH,
      })
    )
  }
}


/**
 * Focus candidates.
 */
function addFocusCandidates(
  candidates,
  focus
) {
  if (!focus) {
    return
  }

  const primary =
    focus.primaryFocus ??
    focus.currentFocus

  if (primary) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.FOCUS,

        type:
          "primary-focus",

        value:
          primary,

        relevance: 1,

        confidence: 1,

        level:
          CONTEXT_LEVELS.CRITICAL,
      })
    )
  }

  if (
    focus.interruptedFocus
  ) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.FOCUS,

        type:
          "interrupted-focus",

        value:
          focus.interruptedFocus,

        relevance: 0.8,

        confidence: 1,

        level:
          CONTEXT_LEVELS.HIGH,
      })
    )
  }
}


/**
 * Cognitive Load candidates.
 */
function addCognitiveLoadCandidates(
  candidates,
  cognitiveLoad
) {
  if (!cognitiveLoad) {
    return
  }

  const current =
    cognitiveLoad.current ??
    cognitiveLoad

  candidates.push(
    createContextItem({
      source:
        CONTEXT_SOURCES.COGNITIVE_LOAD,

      type:
        "system-cognitive-load",

      value:
        current,

      relevance:
        current.level ===
          "overload"
          ? 1
          : current.level ===
              "high"
            ? 0.9
            : 0.65,

      confidence: 1,

      level:
        current.level ===
          "overload"
          ? CONTEXT_LEVELS.CRITICAL
          : CONTEXT_LEVELS.HIGH,
    })
  )
}


/**
 * Intent.
 */
function addIntentCandidates(
  candidates,
  intent
) {
  if (!intent) {
    return
  }

  const current =
    intent.currentIntent ??
    intent

  if (!current?.type) {
    return
  }

  candidates.push(
    createContextItem({
      source:
        CONTEXT_SOURCES.INTENT,

      type:
        "current-intent",

      value:
        current,

      relevance:
        clampNumber(
          current.confidence ??
          0.5,
          0,
          1
        ),

      confidence:
        clampNumber(
          current.confidence ??
          0.5,
          0,
          1
        ),

      level:
        CONTEXT_LEVELS.HIGH,
    })
  )
}


/**
 * Goal.
 */
function addGoalCandidates(
  candidates,
  goal
) {
  if (!goal) {
    return
  }

  if (goal.activeGoal) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.GOAL,

        type:
          "active-goal",

        value:
          goal.activeGoal,

        relevance: 0.95,

        confidence: 1,

        level:
          CONTEXT_LEVELS.CRITICAL,
      })
    )
  }

  const queued =
    Array.isArray(
      goal.queuedGoals
    )
      ? goal.queuedGoals
      : []

  for (
    const item
    of queued.slice(0, 3)
  ) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.GOAL,

        type:
          "queued-goal",

        value:
          item,

        relevance: 0.45,

        confidence: 1,

        level:
          CONTEXT_LEVELS.LOW,
      })
    )
  }
}


/**
 * Planning.
 */
function addPlanningCandidates(
  candidates,
  planning
) {
  if (!planning) {
    return
  }

  if (planning.activePlan) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.PLANNING,

        type:
          "active-plan",

        value:
          simplifyPlan(
            planning.activePlan
          ),

        relevance: 0.9,

        confidence: 1,

        level:
          CONTEXT_LEVELS.HIGH,
      })
    )
  }

  if (planning.nextStep) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.PLANNING,

        type:
          "next-plan-step",

        value:
          planning.nextStep,

        relevance: 0.98,

        confidence: 1,

        level:
          CONTEXT_LEVELS.CRITICAL,
      })
    )
  }
}


/**
 * Workflow.
 */
function addWorkflowCandidates(
  candidates,
  workflow
) {
  if (!workflow) {
    return
  }

  if (
    workflow.activeWorkflow
  ) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.WORKFLOW,

        type:
          "active-workflow",

        value:
          workflow.activeWorkflow,

        relevance: 0.95,

        confidence: 1,

        level:
          CONTEXT_LEVELS.CRITICAL,
      })
    )
  }

  if (workflow.waiting) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.WORKFLOW,

        type:
          "workflow-waiting",

        value:
          workflow.waiting,

        relevance: 1,

        confidence: 1,

        level:
          CONTEXT_LEVELS.CRITICAL,
      })
    )
  }
}


/**
 * Execution.
 */
function addExecutionCandidates(
  candidates,
  execution
) {
  if (!execution) {
    return
  }

  if (
    execution.currentExecution
  ) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.EXECUTION,

        type:
          "current-execution",

        value:
          execution.currentExecution,

        relevance: 1,

        confidence: 1,

        level:
          CONTEXT_LEVELS.CRITICAL,
      })
    )
  }
}


/**
 * Memory.
 */
function addMemoryCandidates(
  candidates,
  memory,
  limit
) {
  if (!memory) {
    return
  }

  const items =
    normalizeCollection(
      memory
    )

  for (
    const item
    of items.slice(0, limit)
  ) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.MEMORY,

        type:
          "relevant-memory",

        value:
          item,

        relevance:
          extractRelevance(
            item,
            0.6
          ),

        confidence:
          extractConfidence(
            item,
            0.7
          ),

        level:
          CONTEXT_LEVELS.MEDIUM,
      })
    )
  }
}


/**
 * Knowledge.
 */
function addKnowledgeCandidates(
  candidates,
  knowledge,
  limit
) {
  if (!knowledge) {
    return
  }

  const items =
    normalizeCollection(
      knowledge
    )

  for (
    const item
    of items.slice(0, limit)
  ) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.KNOWLEDGE,

        type:
          "relevant-knowledge",

        value:
          item,

        relevance:
          extractRelevance(
            item,
            0.65
          ),

        confidence:
          extractConfidence(
            item,
            item?.trust ??
            0.75
          ),

        level:
          CONTEXT_LEVELS.MEDIUM,
      })
    )
  }
}


/**
 * Capabilities.
 */
function addCapabilityCandidates(
  candidates,
  capabilities,
  limit
) {
  if (!capabilities) {
    return
  }

  const available =
    Array.isArray(
      capabilities.available
    )
      ? capabilities.available
      : []

  for (
    const capability
    of available.slice(0, limit)
  ) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.CAPABILITIES,

        type:
          "available-capability",

        value:
          capability,

        relevance: 0.5,

        confidence: 1,

        level:
          CONTEXT_LEVELS.LOW,
      })
    )
  }
}


/**
 * Tools.
 */
function addToolCandidates(
  candidates,
  tools
) {
  if (!tools) {
    return
  }

  const available =
    Array.isArray(
      tools.available
    )
      ? tools.available
      : []

  for (
    const tool
    of available.slice(0, 10)
  ) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.TOOLS,

        type:
          "available-tool",

        value:
          tool,

        relevance: 0.4,

        confidence: 1,

        level:
          CONTEXT_LEVELS.BACKGROUND,
      })
    )
  }
}


/**
 * Identity.
 */
function addIdentityCandidates(
  candidates,
  identity
) {
  if (!identity) {
    return
  }

  candidates.push(
    createContextItem({
      source:
        CONTEXT_SOURCES.IDENTITY,

      type:
        "identity",

      value:
        identity,

      relevance: 0.8,

      confidence: 1,

      level:
        CONTEXT_LEVELS.HIGH,
    })
  )
}


/**
 * Health.
 */
function addHealthCandidates(
  candidates,
  health
) {
  if (!health) {
    return
  }

  if (
    health.status ===
    "degraded"
  ) {
    candidates.push(
      createContextItem({
        source:
          CONTEXT_SOURCES.HEALTH,

        type:
          "degraded-system-health",

        value:
          health,

        relevance: 1,

        confidence: 1,

        level:
          CONTEXT_LEVELS.CRITICAL,
      })
    )
  }
}


/**
 * Luo yhden context itemin.
 */
function createContextItem({
  source,
  type,
  value,

  relevance = 0.5,
  confidence = 1,

  recency = 1,

  level =
    CONTEXT_LEVELS.MEDIUM,

  metadata = null,
}) {
  const safeSource =
    normalizeSource(source) ||
    "unknown"

  const sourceWeight =
    getDefaultSourceWeight(
      safeSource
    )

  const safeRelevance =
    clampNumber(
      relevance,
      0,
      1
    )

  const safeConfidence =
    clampNumber(
      confidence,
      0,
      1
    )

  const safeRecency =
    clampNumber(
      recency,
      0,
      1
    )

  const score =
    clampNumber(
      (
        safeRelevance *
          0.55 +

        safeConfidence *
          0.30 +

        safeRecency *
          0.15
      ) *
        sourceWeight,
      0,
      2
    )

  return {
    id:
      createId(
        "bv-context-item"
      ),

    source:
      safeSource,

    type:
      sanitizeString(type) ||
      "context",

    level:
      normalizeContextLevel(
        level
      ),

    score,

    relevance:
      safeRelevance,

    confidence:
      safeConfidence,

    recency:
      safeRecency,

    value:
      cloneSafe(value),

    metadata,

    createdAt:
      new Date().toISOString(),
  }
}


/**
 * Ranking.
 */
function rankContextItems(
  items
) {
  return items
    .filter(Boolean)
    .sort((a, b) => {
      const levelDifference =
        levelToScore(
          b.level
        ) -
        levelToScore(
          a.level
        )

      if (
        levelDifference !== 0
      ) {
        return levelDifference
      }

      return (
        b.score -
        a.score
      )
    })
}


/**
 * Rajaa contextin.
 */
function selectContextItems(
  items,
  limits
) {
  const selected = []

  let characters = 0
  let trimmed = false

  for (const item of items) {
    if (
      selected.length >=
      limits.maxItems
    ) {
      trimmed = true
      break
    }

    const itemCharacters =
      approximateCharacters(
        item
      )

    if (
      characters +
        itemCharacters >
      limits
        .maxApproxCharacters
    ) {
      trimmed = true

      if (
        item.level !==
        CONTEXT_LEVELS.CRITICAL
      ) {
        continue
      }
    }

    selected.push(item)

    characters +=
      itemCharacters
  }

  return {
    items:
      selected,

    approximateCharacters:
      characters,

    trimmed,
  }
}


/**
 * Capability context kevyeksi.
 */
function simplifyCapabilities(
  capabilities
) {
  if (!capabilities) {
    return []
  }

  const available =
    Array.isArray(
      capabilities.available
    )
      ? capabilities.available
      : []

  return available
    .slice(0, 20)
    .map(
      (item) => ({
        id:
          item.id,

        name:
          item.name,

        risk:
          item.risk,

        requiresApproval:
          item
            .requiresApproval,
      })
    )
}


/**
 * Health kevyeksi.
 */
function simplifyHealth(
  health
) {
  if (!health) {
    return null
  }

  return {
    status:
      health.status ??
      "unknown",

    unhealthyModules:
      Array.isArray(
        health.unhealthyModules
      )
        ? health
            .unhealthyModules
        : [],

    healthyModules:
      health
        .healthyModules ??
      null,

    totalModules:
      health.totalModules ??
      null,
  }
}


/**
 * Planista ei syötetä AI:lle
 * tarpeettomasti kaikkia tuloksia.
 */
function simplifyPlan(plan) {
  if (!plan) {
    return null
  }

  return {
    id:
      plan.id,

    goalId:
      plan.goalId,

    title:
      plan.title,

    status:
      plan.status,

    progress:
      plan.progress,

    steps:
      Array.isArray(
        plan.steps
      )
        ? plan.steps.map(
            (step) => ({
              id:
                step.id,

              title:
                step.title,

              status:
                step.status,

              risk:
                step.risk,

              capability:
                step.capability,

              requiresApproval:
                step
                  .requiresApproval,
            })
          )
        : [],
  }
}


/**
 * Relevance.
 */
function extractRelevance(
  item,
  fallback
) {
  return clampNumber(
    item?.relevance ??
    item?.score ??
    item?.importance ??
    fallback,
    0,
    1
  )
}


/**
 * Confidence.
 */
function extractConfidence(
  item,
  fallback
) {
  return clampNumber(
    item?.confidence ??
    item?.trust ??
    fallback,
    0,
    1
  )
}


/**
 * Collection-normalisointi.
 */
function normalizeCollection(
  value
) {
  if (Array.isArray(value)) {
    return value
  }

  if (
    Array.isArray(
      value.items
    )
  ) {
    return value.items
  }

  if (
    Array.isArray(
      value.memories
    )
  ) {
    return value.memories
  }

  if (
    Array.isArray(
      value.knowledge
    )
  ) {
    return value.knowledge
  }

  return []
}


/**
 * Provider-listaus.
 */
function listContextProviders() {
  ensureInitialized()

  return [
    ...state.providers.values(),
  ].map(
    serializeProvider
  )
}


/**
 * Summary.
 */
function getContextFusionSummary() {
  ensureInitialized()

  return {
    providers:
      state.providers.size,

    latestContextId:
      state.latestContext
        ?.id ??
      null,

    latestContextTimestamp:
      state.latestContext
        ?.timestamp ??
      null,

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
function getContextFusionHistory(
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
function getBoosterverseContextFusionEngineHealth() {
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
      getContextFusionSummary(),
  }
}


/**
 * Reset testeihin.
 */
function resetContextFusionEngine() {
  ensureInitialized()

  state.providers.clear()

  state.latestContext =
    null

  state.history = []

  state.counters = {
    contextsBuilt: 0,
    providersRegistered: 0,
    providerErrors: 0,
    itemsConsidered: 0,
    itemsIncluded: 0,
    itemsDropped: 0,
    contextsTrimmed: 0,
  }

  touch()

  return {
    success: true,
    status: "reset",
  }
}


/**
 * Provider-safe metadata.
 */
function serializeProvider(
  provider
) {
  return {
    id:
      provider.id,

    enabled:
      provider.enabled,

    weight:
      provider.weight,

    description:
      provider.description,

    calls:
      provider.calls,

    failures:
      provider.failures,

    lastCallAt:
      provider.lastCallAt,

    lastError:
      provider.lastError,

    createdAt:
      provider.createdAt,

    updatedAt:
      provider.updatedAt,
  }
}


function getDefaultSourceWeight(
  source
) {
  return (
    DEFAULT_SOURCE_WEIGHTS[
      source
    ] ??
    0.5
  )
}


function normalizeSource(
  source
) {
  if (
    source === null ||
    source === undefined
  ) {
    return null
  }

  return String(source)
    .trim()
    .toLowerCase()
}


function normalizeContextLevel(
  level
) {
  const safe =
    sanitizeString(level)

  const values =
    Object.values(
      CONTEXT_LEVELS
    )

  return values.includes(safe)
    ? safe
    : CONTEXT_LEVELS.MEDIUM
}


function levelToScore(level) {
  switch (
    normalizeContextLevel(
      level
    )
  ) {
    case CONTEXT_LEVELS.CRITICAL:
      return 5

    case CONTEXT_LEVELS.HIGH:
      return 4

    case CONTEXT_LEVELS.MEDIUM:
      return 3

    case CONTEXT_LEVELS.LOW:
      return 2

    case CONTEXT_LEVELS.BACKGROUND:
    default:
      return 1
  }
}


function normalizeLimits(
  limits
) {
  return {
    ...DEFAULT_LIMITS,
    ...(
      limits &&
      typeof limits ===
        "object"
        ? limits
        : {}
    ),
  }
}


function approximateCharacters(
  value
) {
  try {
    return JSON.stringify(
      value
    ).length
  } catch {
    return 500
  }
}


function formatEntity(
  entity
) {
  if (
    entity === null ||
    entity === undefined
  ) {
    return "unknown"
  }

  if (
    typeof entity ===
    "string"
  ) {
    return entity
  }

  return (
    entity.name ||
    entity.title ||
    entity.label ||
    entity.id ||
    "unknown"
  )
}


function formatValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "unknown"
  }

  if (
    typeof value ===
    "string"
  ) {
    return value
  }

  return (
    value.title ||
    value.name ||
    value.content ||
    value.summary ||
    value.description ||
    value.id ||
    JSON.stringify(value)
      .slice(0, 500)
  )
}


function formatPercent(
  value
) {
  const number =
    clampNumber(
      value,
      0,
      1
    )

  return `${Math.round(
    number * 100
  )}%`
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
    initializeBoosterverseContextFusionEngine()
  }
}


export {
  MODULE_ID,
  MODULE_VERSION,

  CONTEXT_LEVELS,
  CONTEXT_SOURCES,

  initializeBoosterverseContextFusionEngine,

  registerContextProvider,

  setContextProviderEnabled,

  buildContext,

  buildContextFromSources,

  getLiveContext,

  getLatestContext,

  buildContextText,

  listContextProviders,

  getContextFusionSummary,

  getContextFusionHistory,

  getBoosterverseContextFusionEngineHealth,

  resetContextFusionEngine,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Context Fusion Engine",

  version:
    MODULE_VERSION,

  description:
    "Yhdistää Boosterversen reaaliaikaisen järjestelmätilan, huomion, fokuksen, tavoitteet, työnkulut, muistin ja tiedon pieneksi relevantiksi Spacemonkey live-contextiksi.",

  initialize:
    initializeBoosterverseContextFusionEngine,

  registerContextProvider,

  setContextProviderEnabled,

  buildContext,

  buildContextFromSources,

  getLiveContext,

  getLatestContext,

  buildContextText,

  listContextProviders,

  getContextFusionSummary,

  getContextFusionHistory,

  health:
    getBoosterverseContextFusionEngineHealth,
}
