/*
=====================================
WOOD-BOOSTER AI BRAIN V2

BRAIN PIPELINE

Vastuut:
- vastaanottaa käyttäjän viestin
- analysoi vuorovaikutuksen
- suorittaa Reasoning Modulen
- suorittaa Decision Modulen
- suorittaa päätöksen valitseman moduulin
- pysäyttää ketjun turvallisesti,
  jos lisätietoja tarvitaan
- palauttaa koko ketjun tulokset

Tämä tiedosto ei:
- muuta tavallista brainRuntimea
- muuta moduleRouteria
- rekisteröi uusia moduuleja
- sisällä moduulien liiketoimintalogiikkaa
- kutsu kielimallia suoraan
=====================================
*/


import {
  ensureDefaultBrainModules,
} from "./index.js"

import {
  executeBrainModuleById,
} from "./moduleExecutor.js"

import {
  analyzeInteraction,
} from "./system/interactionEngine.js"


function createPipelineRequestId() {
  const timestamp =
    Date.now()
      .toString(36)

  const randomPart =
    Math.random()
      .toString(36)
      .slice(2, 10)

  return (
    `pipeline-${timestamp}-` +
    randomPart
  )
}


function normalizeMessage(value) {
  return String(value || "")
    .trim()
}


function createInvalidPipelineResult({
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

    stages: {
      interaction:
        null,

      reasoning:
        null,

      decision:
        null,

      execution:
        null,
    },

    finalOutput:
      null,

    error: {
      code:
        "INVALID_MESSAGE",

      message:
        "AI Brain Pipeline tarvitsee käsiteltävän viestin.",
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


function createPipelineFailure({
  requestId,
  message,
  status,
  stages,
  error,
  startedAt,
}) {
  const completedAt =
    new Date()

  return {
    success:
      false,

    status,

    requestId,

    message,

    stages,

    finalOutput:
      null,

    error,

    startedAt:
      startedAt.toISOString(),

    completedAt:
      completedAt.toISOString(),

    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),
  }
}


function createClarificationResult({
  requestId,
  message,
  stages,
  decisionOutput,
  startedAt,
}) {
  const completedAt =
    new Date()

  return {
    success:
      true,

    status:
      "clarification_required",

    requestId,

    message,

    stages,

    finalOutput: {
      type:
        "clarification_result",

      answer:
        decisionOutput.reason,

      decision:
        decisionOutput.decision,

      missingInformation:
        decisionOutput
          .missingInformation ||
        [],

      confidence:
        decisionOutput.confidence,
    },

    error:
      null,

    startedAt:
      startedAt.toISOString(),

    completedAt:
      completedAt.toISOString(),

    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),
  }
}


function createCompletedPipelineResult({
  requestId,
  message,
  stages,
  executionResult,
  startedAt,
}) {
  const completedAt =
    new Date()

  return {
    success:
      true,

    status:
      "completed",

    requestId,

    message,

    stages,

    finalOutput:
      executionResult.output,

    error:
      null,

    startedAt:
      startedAt.toISOString(),

    completedAt:
      completedAt.toISOString(),

    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),
  }
}


async function runBrainPipeline({
  message,
  source =
    "brain-pipeline",
  runtimeContext = {},
} = {}) {
  const startedAt =
    new Date()

  const requestId =
    createPipelineRequestId()

  const normalizedMessage =
    normalizeMessage(
      message,
    )

  if (!normalizedMessage) {
    return createInvalidPipelineResult({
      requestId,
      message:
        normalizedMessage,
      startedAt,
    })
  }


  ensureDefaultBrainModules()


  const request = {
    requestId,

    message:
      normalizedMessage,
  }


  const interaction =
    analyzeInteraction(
      normalizedMessage,
    )


  const baseRuntimeContext = {
    ...runtimeContext,

    requestId,

    source:
      String(
        source ||
        runtimeContext.source ||
        "brain-pipeline",
      ).trim(),

    pipeline:
      true,

    pipelineStartedAt:
      startedAt.toISOString(),

    interaction,
  }


  const stages = {
    interaction: {
      success:
        true,

      status:
        "completed",

      output:
        interaction,

      error:
        null,
    },

    reasoning:
      null,

    decision:
      null,

    execution:
      null,
  }


  const reasoningResult =
    await executeBrainModuleById({
      moduleId:
        "reasoning",

      message:
        normalizedMessage,

      request,

      runtimeContext: {
        ...baseRuntimeContext,

        reasoningOnly:
          true,
      },
    })


  stages.reasoning =
    reasoningResult


  if (!reasoningResult.success) {
    return createPipelineFailure({
      requestId,
      message:
        normalizedMessage,
      status:
        "reasoning_failed",
      stages,
      error:
        reasoningResult.error,
      startedAt,
    })
  }


  const reasoningAnalysis =
    reasoningResult.output
      ?.analysis ||
    null


  if (!reasoningAnalysis) {
    return createPipelineFailure({
      requestId,
      message:
        normalizedMessage,
      status:
        "reasoning_failed",
      stages,
      error: {
        code:
          "REASONING_ANALYSIS_MISSING",

        message:
          "Reasoning Module ei palauttanut analyysiä.",
      },
      startedAt,
    })
  }


  const decisionResult =
    await executeBrainModuleById({
      moduleId:
        "decision",

      message:
        normalizedMessage,

      request,

      runtimeContext: {
        ...baseRuntimeContext,

        decisionOnly:
          true,

        reasoningAnalysis,
      },
    })


  stages.decision =
    decisionResult


  if (!decisionResult.success) {
    return createPipelineFailure({
      requestId,
      message:
        normalizedMessage,
      status:
        "decision_failed",
      stages,
      error:
        decisionResult.error,
      startedAt,
    })
  }


  const decisionOutput =
    decisionResult.output ||
    null


  if (!decisionOutput) {
    return createPipelineFailure({
      requestId,
      message:
        normalizedMessage,
      status:
        "decision_failed",
      stages,
      error: {
        code:
          "DECISION_OUTPUT_MISSING",

        message:
          "Decision Module ei palauttanut päätöstä.",
      },
      startedAt,
    })
  }


  if (
    decisionOutput.decision ===
    "clarify"
  ) {
    return createClarificationResult({
      requestId,
      message:
        normalizedMessage,
      stages,
      decisionOutput,
      startedAt,
    })
  }


  const targetModule =
    String(
      decisionOutput.targetModule ||
      "",
    ).trim()


  if (!targetModule) {
    return createPipelineFailure({
      requestId,
      message:
        normalizedMessage,
      status:
        "target_module_missing",
      stages,
      error: {
        code:
          "TARGET_MODULE_MISSING",

        message:
          "Decision Module ei valinnut suoritettavaa kohdemoduulia.",
      },
      startedAt,
    })
  }


  const executionResult =
    await executeBrainModuleById({
      moduleId:
        targetModule,

      message:
        normalizedMessage,

      request,

      runtimeContext: {
        ...baseRuntimeContext,

        reasoningAnalysis,

        decision:
          decisionOutput,

        selectedModule:
          targetModule,
      },

      route: {
        confidence:
          decisionOutput.confidence,

        reason:
          decisionOutput.reason,

        metadata: {
          pipeline:
            true,

          selectedBy:
            "decision",

          targetModule,

          interactionMode:
            interaction.mode,

          interactionState:
            interaction.state,
        },
      },
    })


  stages.execution =
    executionResult


  if (!executionResult.success) {
    return createPipelineFailure({
      requestId,
      message:
        normalizedMessage,
      status:
        "execution_failed",
      stages,
      error:
        executionResult.error,
      startedAt,
    })
  }


  return createCompletedPipelineResult({
    requestId,
    message:
      normalizedMessage,
    stages,
    executionResult,
    startedAt,
  })
}


export {
  runBrainPipeline,
}
