import {
  apiPost,
} from "../api/client"

import {
  dispatchAIActions,
  normalizeActionResponse,
} from "./aiActionDispatcher"

import {
  parseLocalAICommand,
} from "./aiCommandQueueParser"

import {
  createRuntimeContext,
} from "./runtime/runtimeContext"

import {
  getSystemRegistry,
} from "./system/systemRegistry"


function createSessionResult({
  success,
  type,
  source,
  message,
  agent = "system",
  reason = "",
  plan = null,
  intentAnalysis = null,
  plannerDecision = null,
  executionPlan = null,
  actions = [],
  actionResult = null,
  data = null,
  error = null,
}) {
  return {
    success,
    type,
    source,
    message,
    agent,
    reason,
    plan,
    intentAnalysis,
    plannerDecision,
    executionPlan,
    actions,
    actionResult,
    data,
    error,
  }
}


function normalizeConversation(
  conversation,
) {
  if (!Array.isArray(conversation)) {
    return []
  }

  return conversation
    .filter(
      (conversationMessage) =>
        conversationMessage &&
        conversationMessage.role &&
        conversationMessage.content,
    )
    .map(
      (conversationMessage) => ({
        role:
          conversationMessage.role,

        content:
          conversationMessage.content,
      }),
    )
}


function getPlanActions(
  plan,
) {
  return normalizeActionResponse(
    plan?.actions ??
      plan?.action ??
      plan,
  )
}


function getIntentAnalysis(
  data,
) {
  return (
    data?.intentAnalysis ||
    data?.intent_analysis ||
    data?.analysis?.intentAnalysis ||
    data?.analysis?.intent ||
    data?.pipeline?.intentAnalysis ||
    data?.pipeline?.intent ||
    null
  )
}


function getPlannerDecision(
  data,
) {
  return (
    data?.plannerDecision ||
    data?.planner_decision ||
    data?.planning?.plannerDecision ||
    data?.planning?.decision ||
    data?.pipeline?.plannerDecision ||
    data?.pipeline?.decision ||
    null
  )
}


function getExecutionPlan(
  data,
) {
  return (
    data?.executionPlan ||
    data?.execution_plan ||
    data?.planning?.executionPlan ||
    data?.planning?.plan ||
    data?.pipeline?.executionPlan ||
    data?.pipeline?.plan ||
    null
  )
}


function createLocalIntentAnalysis({
  message,
  actions,
}) {
  const actionTypes =
    actions
      .map(
        (action) =>
          String(
            action?.type ||
            "",
          ).trim(),
      )
      .filter(Boolean)

  return {
    primaryIntent:
      actionTypes[0] ||
      "local_command",

    intent:
      actionTypes[0] ||
      "local_command",

    intents:
      actionTypes,

    commandCount:
      actions.length,

    confidence:
      actions.length > 0
        ? 1
        : 0,

    source:
      "local-command-parser",

    message,
  }
}


function createLocalPlannerDecision({
  plan,
  actions,
}) {
  return {
    plannerId:
      plan?.plannerId ||
      plan?.capability ||
      "local-command-planner",

    selectedPlanner:
      plan?.plannerId ||
      plan?.capability ||
      "local-command-planner",

    capability:
      plan?.capability ||
      plan?.plannerId ||
      "local-command-planner",

    hasMatchedPlanner:
      actions.length > 0,

    confidence:
      actions.length > 0
        ? 1
        : 0,

    reason:
      actions.length > 1
        ? "Paikallinen monitoimikomento tunnistettiin."
        : "Paikallinen komento tunnistettiin.",

    source:
      plan?.source ||
      "local-ai-session",
  }
}


function createLocalExecutionPlan(
  actions,
) {
  return {
    type:
      "sequential",

    source:
      "local-command-parser",

    totalSteps:
      actions.length,

    actions,

    steps:
      actions.map(
        (action, index) => ({
          id:
            `local-step-${index + 1}`,

          index,

          order:
            index + 1,

          plannerId:
            "local-command-planner",

          command:
            action?.label ||
            action?.name ||
            action?.type ||
            `Toiminto ${index + 1}`,

          action,

          dependsOn:
            index === 0
              ? []
              : [
                  `local-step-${index}`,
                ],
        }),
      ),
  }
}


function createSystemContext() {
  const registry =
    getSystemRegistry()

  return {
    system: {
      id:
        registry.metadata.id,

      name:
        registry.metadata.name,

      version:
        registry.metadata.version,

      environment:
        registry.metadata.environment,

      status:
        registry.status.health,

      mode:
        registry.status.mode,
    },

    agents:
      registry.agents.map(
        (agent) => ({
          id:
            agent.id,

          name:
            agent.name,

          status:
            agent.status,

          description:
            agent.description,

          capabilities:
            agent.capabilities,

          truthSources:
            agent.truthSources,
        }),
      ),

    capabilities:
      registry.capabilities.map(
        (capability) => ({
          id:
            capability.id,

          name:
            capability.name,

          description:
            capability.description,

          enabled:
            capability.enabled,

          actions:
            capability.actions,

          tools:
            capability.tools,
        }),
      ),

    tools:
      registry.tools.map(
        (tool) => ({
          id:
            tool.id,

          name:
            tool.name,

          description:
            tool.description,

          enabled:
            tool.enabled,

          healthy:
            tool.healthy,

          actions:
            tool.actions,

          supportedActions:
            tool.supportedActions,

          missingActions:
            tool.missingActions,
        }),
      ),

    routes:
      registry.routes.map(
        (route) => ({
          id:
            route.id,

          name:
            route.name,

          path:
            route.path,

          category:
            route.category,
        }),
      ),

    actions:
      registry.actions,

    truthSources:
      registry.truthSources,

    summary:
      registry.summary,
  }
}


function createSessionContext() {
  return {
    systemContext:
      createSystemContext(),

    runtimeContext:
      createRuntimeContext(),
  }
}


function createPlanningSnapshot({
  type,
  source,
  agent,
  reason,
  plan,
  intentAnalysis,
  plannerDecision,
  executionPlan,
  actions,
}) {
  return {
    type,
    source,
    agent,
    reason,
    plan,
    intentAnalysis,
    plannerDecision,
    executionPlan,
    actions,
    status:
      actions.length > 0
        ? "ready"
        : "completed",

    timestamp:
      new Date().toISOString(),
  }
}


function notifyPlanningReady({
  onPlanningReady,
  planningSnapshot,
}) {
  if (
    typeof onPlanningReady !==
    "function"
  ) {
    return
  }

  try {
    onPlanningReady(
      planningSnapshot,
    )
  }
  catch (error) {
    console.error(
      "AI planning callback failed:",
      error,
    )
  }
}


async function executeSessionActions({
  actions,
  navigate,
  stopOnError = false,
  onQueueStart,
  onQueueChange,
  onActionStart,
  onActionComplete,
}) {
  const normalizedActions =
    normalizeActionResponse(
      actions,
    )

  if (
    normalizedActions.length ===
    0
  ) {
    return null
  }

  return dispatchAIActions({
    actions:
      normalizedActions,

    navigate,
    stopOnError,
    onQueueStart,
    onQueueChange,
    onActionStart,
    onActionComplete,
  })
}


async function runLocalAISession({
  message,
  navigate,
  executeActions = true,
  stopOnError = false,
  onPlanningReady,
  onQueueStart,
  onQueueChange,
  onActionStart,
  onActionComplete,
}) {
  const plan =
    parseLocalAICommand(
      message,
    )

  if (!plan) {
    return null
  }

  const actions =
    getPlanActions(
      plan,
    )

  const intentAnalysis =
    createLocalIntentAnalysis({
      message,
      actions,
    })

  const plannerDecision =
    createLocalPlannerDecision({
      plan,
      actions,
    })

  const executionPlan =
    createLocalExecutionPlan(
      actions,
    )

  const planningSnapshot =
    createPlanningSnapshot({
      type:
        "local_command",

      source:
        plan.source ||
        "local-ai-session",

      agent:
        "system",

      reason:
        actions.length > 1
          ? "Paikallinen AI OS -monitoimikomento"
          : "Paikallinen AI OS -komento",

      plan,
      intentAnalysis,
      plannerDecision,
      executionPlan,
      actions,
    })

  notifyPlanningReady({
    onPlanningReady,
    planningSnapshot,
  })

  let actionResult =
    null

  if (
    executeActions &&
    actions.length > 0
  ) {
    actionResult =
      await executeSessionActions({
        actions,
        navigate,
        stopOnError,
        onQueueStart,
        onQueueChange,
        onActionStart,
        onActionComplete,
      })
  }

  return createSessionResult({
    success:
      actionResult
        ? actionResult.success
        : true,

    type:
      "local_command",

    source:
      plan.source ||
      "local-ai-session",

    message:
      actions.length > 1
        ? `Suoritetaan ${actions.length} toimintoa järjestyksessä.`
        : "Suoritetaan paikallinen AI OS -komento.",

    agent:
      "system",

    reason:
      actions.length > 1
        ? "Paikallinen AI OS -monitoimikomento"
        : "Paikallinen AI OS -komento",

    plan,
    intentAnalysis,
    plannerDecision,
    executionPlan,
    actions,
    actionResult,
  })
}


async function runRemoteAISession({
  message,
  conversation = [],
  navigate,
  executeActions = true,
  stopOnError = false,
  onPlanningReady,
  onQueueStart,
  onQueueChange,
  onActionStart,
  onActionComplete,
}) {
  const normalizedConversation =
    normalizeConversation(
      conversation,
    )

  const sessionContext =
    createSessionContext()

  const data =
    await apiPost(
      "/ai-brain-v2/chat",
      {
        message,

        conversation:
          normalizedConversation,

        systemContext:
          sessionContext.systemContext,

        runtimeContext:
          sessionContext.runtimeContext,
      },
    )

  const agent =
    data.agent ||
    "system"

  const answer =
    data.answer ||
    data.response ||
    data.message ||
    "AI Brain ei palauttanut vastausta."

  const reason =
    data.reason ||
    ""

  const plan =
    data.plan ||
    data.capabilityPlan ||
    null

  const intentAnalysis =
    getIntentAnalysis(
      data,
    )

  const plannerDecision =
    getPlannerDecision(
      data,
    )

  const executionPlan =
    getExecutionPlan(
      data,
    )

  const actions =
    normalizeActionResponse(
      data.actions ??
        data.action ??
        executionPlan?.actions ??
        executionPlan?.steps?.map(
          (step) =>
            step?.action,
        ) ??
        plan?.actions,
    )

  const planningSnapshot =
    createPlanningSnapshot({
      type:
        data.type ||
        "remote_ai",

      source:
        data.source ||
        "ai-brain",

      agent,
      reason,
      plan,
      intentAnalysis,
      plannerDecision,
      executionPlan,
      actions,
    })

  notifyPlanningReady({
    onPlanningReady,
    planningSnapshot,
  })

  let actionResult =
    null

  if (
    executeActions &&
    actions.length > 0
  ) {
    actionResult =
      await executeSessionActions({
        actions,
        navigate,
        stopOnError,
        onQueueStart,
        onQueueChange,
        onActionStart,
        onActionComplete,
      })
  }

  return createSessionResult({
    success:
      actionResult
        ? actionResult.success
        : data.success !== false,

    type:
      data.type ||
      "remote_ai",

    source:
      data.source ||
      "ai-brain",

    message:
      answer,

    agent,
    reason,
    plan,
    intentAnalysis,
    plannerDecision,
    executionPlan,
    actions,
    actionResult,
    data,
  })
}


async function runAISession({
  message,
  conversation = [],
  navigate,
  executeActions = true,
  stopOnError = false,
  onPlanningReady,
  onQueueStart,
  onQueueChange,
  onActionStart,
  onActionComplete,
}) {
  const normalizedMessage =
    String(
      message ||
      "",
    ).trim()

  if (!normalizedMessage) {
    return createSessionResult({
      success:
        false,

      type:
        "invalid_message",

      source:
        "ai-session",

      message:
        "AI Session ei saanut viestiä.",

      error:
        "EMPTY_MESSAGE",
    })
  }

  try {
    const localResult =
      await runLocalAISession({
        message:
          normalizedMessage,

        navigate,
        executeActions,
        stopOnError,
        onPlanningReady,
        onQueueStart,
        onQueueChange,
        onActionStart,
        onActionComplete,
      })

    if (localResult) {
      return localResult
    }

    return await runRemoteAISession({
      message:
        normalizedMessage,

      conversation,
      navigate,
      executeActions,
      stopOnError,
      onPlanningReady,
      onQueueStart,
      onQueueChange,
      onActionStart,
      onActionComplete,
    })
  }
  catch (error) {
    console.error(
      "AI Session error:",
      error,
    )

    return createSessionResult({
      success:
        false,

      type:
        "session_error",

      source:
        "ai-session",

      message:
        error?.message ||
        "AI Sessionin suorittaminen epäonnistui.",

      error,
    })
  }
}


export {
  createPlanningSnapshot,
  createSessionContext,
  createSystemContext,
  executeSessionActions,
  normalizeConversation,
  runAISession,
  runLocalAISession,
  runRemoteAISession,
}
