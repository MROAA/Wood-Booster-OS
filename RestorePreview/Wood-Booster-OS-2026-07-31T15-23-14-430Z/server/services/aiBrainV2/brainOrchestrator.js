/*
=====================================
WOOD-BOOSTER AI BRAIN V2

BRAIN ORCHESTRATOR

Vastuut:
- toimii AI Brain V2:n pääohjaimena
- vastaanottaa suoritettavan pyynnön
- valmistelee orchestrator-kontekstin
- käynnistää Brain Pipelinen
- palauttaa yhtenäisen lopputuloksen
- säilyttää paikan tuleville vaiheille

Tulevia vaiheita:
- Finnish Language Layer
- käyttäjän kirjoitusprofiili
- Memory Before
- Knowledge Retrieval
- Safety Validation
- Reflection
- Response Formatting

Tämä tiedosto ei:
- analysoi käyttäjän viestiä itse
- valitse kohdemoduulia itse
- suorita moduuleja suoraan
- sisällä Action-logiikkaa
- sisällä Memory-logiikkaa
- sisällä Knowledge-logiikkaa
- kutsu kielimallia suoraan
- muuta vanhaa AI Brainia
=====================================
*/


import {
  runBrainPipeline,
} from "./brainPipeline.js"


function normalizeText(value) {
  return String(
    value ||
    "",
  ).trim()
}


function createOrchestratorRequestId() {
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
    `orchestrator-${timestamp}-` +
    randomPart
  )
}


function createOrchestratorContext({
  requestId,
  source,
  runtimeContext,
  startedAt,
}) {
  return {
    ...runtimeContext,

    orchestrator:
      true,

    orchestratorRequestId:
      requestId,

    orchestratorSource:
      source,

    orchestratorStartedAt:
      startedAt.toISOString(),
  }
}


function createInvalidOrchestratorResult({
  requestId,
  message,
  source,
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

    source,

    message,

    pipelineResult:
      null,

    finalOutput:
      null,

    error: {
      code:
        "INVALID_MESSAGE",

      message:
        "Brain Orchestrator tarvitsee käsiteltävän viestin.",
    },

    metadata: {
      orchestrator:
        true,

      pipelineExecuted:
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


function createOrchestratorFailure({
  requestId,
  message,
  source,
  pipelineResult,
  startedAt,
}) {
  const completedAt =
    new Date()

  return {
    success:
      false,

    status:
      pipelineResult?.status ||
      "pipeline_failed",

    requestId,

    source,

    message,

    pipelineResult,

    finalOutput:
      null,

    error:
      pipelineResult?.error || {
        code:
          "PIPELINE_FAILED",

        message:
          "Brain Pipeline epäonnistui ilman tarkempaa virhettä.",
      },

    metadata: {
      orchestrator:
        true,

      pipelineExecuted:
        true,

      pipelineRequestId:
        pipelineResult
          ?.requestId ||
        null,
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


function createOrchestratorSuccess({
  requestId,
  message,
  source,
  pipelineResult,
  startedAt,
}) {
  const completedAt =
    new Date()

  return {
    success:
      true,

    status:
      pipelineResult.status,

    requestId,

    source,

    message,

    pipelineResult,

    finalOutput:
      pipelineResult.finalOutput,

    error:
      null,

    metadata: {
      orchestrator:
        true,

      pipelineExecuted:
        true,

      pipelineRequestId:
        pipelineResult.requestId,

      pipelineStatus:
        pipelineResult.status,

      clarificationRequired:
        pipelineResult.status ===
        "clarification_required",
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


async function runBrainOrchestrator({
  message,
  source =
    "brain-orchestrator",
  runtimeContext = {},
} = {}) {
  const startedAt =
    new Date()

  const requestId =
    createOrchestratorRequestId()

  const normalizedMessage =
    normalizeText(
      message,
    )

  const normalizedSource =
    normalizeText(
      source,
    ) ||
    "brain-orchestrator"


  if (!normalizedMessage) {
    return createInvalidOrchestratorResult({
      requestId,

      message:
        normalizedMessage,

      source:
        normalizedSource,

      startedAt,
    })
  }


  const orchestratorContext =
    createOrchestratorContext({
      requestId,

      source:
        normalizedSource,

      runtimeContext,

      startedAt,
    })


  try {
    const pipelineResult =
      await runBrainPipeline({
        message:
          normalizedMessage,

        source:
          normalizedSource,

        runtimeContext:
          orchestratorContext,
      })


    if (!pipelineResult?.success) {
      return createOrchestratorFailure({
        requestId,

        message:
          normalizedMessage,

        source:
          normalizedSource,

        pipelineResult,

        startedAt,
      })
    }


    return createOrchestratorSuccess({
      requestId,

      message:
        normalizedMessage,

      source:
        normalizedSource,

      pipelineResult,

      startedAt,
    })
  } catch (error) {
    const completedAt =
      new Date()

    return {
      success:
        false,

      status:
        "orchestrator_failed",

      requestId,

      source:
        normalizedSource,

      message:
        normalizedMessage,

      pipelineResult:
        null,

      finalOutput:
        null,

      error: {
        code:
          "ORCHESTRATOR_EXECUTION_FAILED",

        message:
          error instanceof Error
            ? error.message
            : "Brain Orchestratorin suoritus epäonnistui.",
      },

      metadata: {
        orchestrator:
          true,

        pipelineExecuted:
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
}


export {
  runBrainOrchestrator,
}
