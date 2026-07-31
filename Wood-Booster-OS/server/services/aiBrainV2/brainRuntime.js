/*
=====================================
WOOD-BOOSTER AI BRAIN V2

BRAIN RUNTIME

Vastuut:
- vastaanottaa AI Brain -pyynnön
- validoi pyynnön
- muodostaa runtime-kontekstin
- käynnistää Brain Orchestratorin
- sovittaa Orchestratorin tuloksen
  runtime-vastausmuotoon
- säilyttää nykyisen runtime-rajapinnan

Nykyinen suoritusketju:

Brain Runtime
    ↓
Brain Orchestrator
    ↓
Brain Pipeline
    ↓
Reasoning Module
    ↓
Decision Module
    ↓
Module Executor
    ↓
Valittu kohdemoduuli

Tämä tiedosto ei:
- rekisteröi moduuleja
- reititä moduuleja itse
- pisteytä moduuleja
- sisällä liiketoimintalogiikkaa
- kutsu kielimallia suoraan
- muuta vanhaa AI Brainia
=====================================
*/


import {
  runBrainOrchestrator,
} from "./brainOrchestrator.js"


function createRequestId() {
  const timestamp =
    Date.now()
      .toString(36)

  const randomPart =
    Math.random()
      .toString(36)
      .slice(
        2,
        10,
      )

  return (
    `brain-${timestamp}-` +
    randomPart
  )
}


function normalizeMessage(value) {
  return String(
    value ||
    "",
  ).trim()
}


function normalizeSource({
  source,
  runtimeContext,
}) {
  return String(
    source ||
    runtimeContext?.source ||
    "unknown",
  ).trim() ||
  "unknown"
}


function createRuntimeContext({
  requestId,
  source,
  runtimeContext,
  startedAt,
}) {
  return {
    ...runtimeContext,

    requestId,

    source,

    runtime:
      true,

    runtimeRequestId:
      requestId,

    runtimeStartedAt:
      startedAt.toISOString(),
  }
}


function createInvalidRequestResult({
  requestId,
  message,
  startedAt,
}) {
  const completedAt =
    new Date()

  return {
    success:
      false,

    status:
      "invalid_request",

    requestId,

    message,

    module:
      null,

    route:
      null,

    output:
      null,

    error: {
      code:
        "INVALID_MESSAGE",

      message:
        "AI Brain tarvitsee käsiteltävän viestin.",
    },

    metadata: {
      runtime:
        true,

      orchestratorExecuted:
        false,
    },

    startedAt:
      startedAt.toISOString(),

    completedAt:
      completedAt.toISOString(),

    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),
  }
}


function getPipelineStages(
  orchestratorResult,
) {
  return (
    orchestratorResult
      ?.pipelineResult
      ?.stages ||
    {
      reasoning:
        null,

      decision:
        null,

      execution:
        null,
    }
  )
}


function getSelectedModule(
  orchestratorResult,
) {
  const stages =
    getPipelineStages(
      orchestratorResult,
    )

  if (
    stages.execution
      ?.module
  ) {
    return {
      ...stages.execution.module,
    }
  }

  if (
    stages.decision
      ?.module
  ) {
    return {
      ...stages.decision.module,
    }
  }

  return null
}


function getRuntimeRoute(
  orchestratorResult,
) {
  const stages =
    getPipelineStages(
      orchestratorResult,
    )

  const decisionOutput =
    stages.decision
      ?.output ||
    null

  const executionModule =
    stages.execution
      ?.module ||
    null

  if (!decisionOutput) {
    return null
  }

  return {
    matched:
      Boolean(
        executionModule ||
        decisionOutput.decision ===
          "clarify",
      ),

    confidence:
      decisionOutput.confidence ??
      0,

    reason:
      decisionOutput.reason ||
      "",

    metadata: {
      decision:
        decisionOutput.decision ||
        null,

      targetModule:
        decisionOutput.targetModule ||
        null,

      clarificationRequired:
        decisionOutput.decision ===
        "clarify",

      selectedBy:
        "decision-module",

      orchestrator:
        true,
    },
  }
}


function createCompletedResult({
  requestId,
  message,
  source,
  orchestratorResult,
  startedAt,
}) {
  const completedAt =
    new Date()

  return {
    success:
      true,

    status:
      orchestratorResult.status,

    requestId,

    message,

    module:
      getSelectedModule(
        orchestratorResult,
      ),

    route:
      getRuntimeRoute(
        orchestratorResult,
      ),

    output:
      orchestratorResult.finalOutput,

    error:
      null,

    metadata: {
      runtime:
        true,

      orchestratorExecuted:
        true,

      orchestratorRequestId:
        orchestratorResult.requestId,

      pipelineRequestId:
        orchestratorResult
          .metadata
          ?.pipelineRequestId ||
        null,

      pipelineStatus:
        orchestratorResult
          .metadata
          ?.pipelineStatus ||
        null,

      clarificationRequired:
        orchestratorResult
          .metadata
          ?.clarificationRequired ===
        true,

      source,
    },

    startedAt:
      startedAt.toISOString(),

    completedAt:
      completedAt.toISOString(),

    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),
  }
}


function createOrchestratorErrorResult({
  requestId,
  message,
  source,
  orchestratorResult,
  startedAt,
}) {
  const completedAt =
    new Date()

  return {
    success:
      false,

    status:
      orchestratorResult?.status ||
      "orchestrator_failed",

    requestId,

    message,

    module:
      getSelectedModule(
        orchestratorResult,
      ),

    route:
      getRuntimeRoute(
        orchestratorResult,
      ),

    output:
      null,

    error:
      orchestratorResult?.error || {
        code:
          "ORCHESTRATOR_FAILED",

        message:
          "Brain Orchestratorin suoritus epäonnistui.",
      },

    metadata: {
      runtime:
        true,

      orchestratorExecuted:
        true,

      orchestratorRequestId:
        orchestratorResult
          ?.requestId ||
        null,

      pipelineRequestId:
        orchestratorResult
          ?.metadata
          ?.pipelineRequestId ||
        null,

      source,
    },

    startedAt:
      startedAt.toISOString(),

    completedAt:
      completedAt.toISOString(),

    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),
  }
}


function createUnexpectedErrorResult({
  requestId,
  message,
  source,
  error,
  startedAt,
}) {
  const completedAt =
    new Date()

  return {
    success:
      false,

    status:
      "runtime_error",

    requestId,

    message,

    module:
      null,

    route:
      null,

    output:
      null,

    error: {
      code:
        "RUNTIME_EXECUTION_FAILED",

      message:
        error instanceof Error
          ? error.message
          : String(
              error,
            ),
    },

    metadata: {
      runtime:
        true,

      orchestratorExecuted:
        false,

      source,
    },

    startedAt:
      startedAt.toISOString(),

    completedAt:
      completedAt.toISOString(),

    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),
  }
}


async function runBrainRuntime({
  message,
  source,
  runtimeContext = {},
} = {}) {
  const startedAt =
    new Date()

  const requestId =
    createRequestId()

  const normalizedMessage =
    normalizeMessage(
      message,
    )

  if (!normalizedMessage) {
    return createInvalidRequestResult({
      requestId,

      message:
        normalizedMessage,

      startedAt,
    })
  }


  const normalizedSource =
    normalizeSource({
      source,
      runtimeContext,
    })


  const context =
    createRuntimeContext({
      requestId,

      source:
        normalizedSource,

      runtimeContext,

      startedAt,
    })


  try {
    const orchestratorResult =
      await runBrainOrchestrator({
        message:
          normalizedMessage,

        source:
          normalizedSource,

        runtimeContext:
          context,
      })


    if (!orchestratorResult?.success) {
      return createOrchestratorErrorResult({
        requestId,

        message:
          normalizedMessage,

        source:
          normalizedSource,

        orchestratorResult,

        startedAt,
      })
    }


    return createCompletedResult({
      requestId,

      message:
        normalizedMessage,

      source:
        normalizedSource,

      orchestratorResult,

      startedAt,
    })
  } catch (error) {
    return createUnexpectedErrorResult({
      requestId,

      message:
        normalizedMessage,

      source:
        normalizedSource,

      error,

      startedAt,
    })
  }
}


export {
  runBrainRuntime,
}
