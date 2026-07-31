/*
=====================================
WOOD-BOOSTER AI BRAIN V2

EXPRESS ROUTER V1.1

Endpointit:

GET
/api/ai-brain-v2

POST
/api/ai-brain-v2/chat

Sisältää:
- AI Brain V2 HTTP -rajapinnan
- frontend-yhteensopivan Session Adapterin
- alkuperäisen Brain-tuloksen säilyttämisen

Router ei:
- sisällä Brainin sisäistä logiikkaa
- valitse moduulia itse
- käsittele credentials-salaisuuksia
- korvaa vanhaa AI Brain -reittiä
=====================================
*/


import express from "express"

import {
  getBrainModuleInfo,
  runBrain,
} from "../services/aiBrainV2/index.js"


function normalizeMessage(value) {
  return String(value || "")
    .trim()
}


function normalizeSource(value) {
  const source =
    String(value || "")
      .trim()

  if (!source) {
    return "ai-brain-v2-api"
  }

  return source
}


function normalizeObject(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {}
  }

  return value
}


function normalizeConversation(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (conversationMessage) =>
        conversationMessage &&
        conversationMessage.role &&
        conversationMessage.content,
    )
    .map(
      (conversationMessage) => ({
        role:
          String(
            conversationMessage.role,
          ),

        content:
          String(
            conversationMessage.content,
          ),
      }),
    )
}


function normalizeActions(value) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  if (
    typeof value === "object"
  ) {
    return [value]
  }

  return []
}


function getOutput(result) {
  return normalizeObject(
    result?.output,
  )
}


function getAgent(result) {
  return (
    result?.agent ||
    result?.module?.id ||
    result?.selectedModule?.id ||
    result?.routing?.moduleId ||
    "system"
  )
}


function getReason(result) {
  const output =
    getOutput(result)

  return (
    result?.reason ||
    output?.reason ||
    result?.routing?.reason ||
    result?.decision?.reason ||
    result?.module?.description ||
    ""
  )
}


function getAnswer(result) {
  const output =
    getOutput(result)

  const directAnswer =
    output.answer ||
    output.response ||
    output.message ||
    output.content ||
    result?.answer ||
    result?.response ||
    result?.message

  if (
    typeof directAnswer ===
      "string" &&
    directAnswer.trim()
  ) {
    return directAnswer.trim()
  }

  const actions =
    getActions(result)

  if (actions.length > 1) {
    return `AI Brain V2 valmisteli ${actions.length} toimintoa.`
  }

  if (actions.length === 1) {
    return "AI Brain V2 valmisteli toiminnon."
  }

  if (result?.success === false) {
    return (
      result?.error?.message ||
      result?.error ||
      "AI Brain V2 ei pystynyt käsittelemään pyyntöä."
    )
  }

  return "AI Brain V2 käsitteli pyynnön."
}


function getActions(result) {
  const output =
    getOutput(result)

  const possibleActions = [
    output.actions,
    output.action,
    result?.actions,
    result?.action,
    result?.executionPlan
      ?.actions,
    result?.executionPlan
      ?.steps
      ?.map(
        (step) =>
          step?.action,
      ),
    result?.decision?.actions,
    result?.decision?.action,
  ]

  for (
    const actionValue
    of possibleActions
  ) {
    const actions =
      normalizeActions(
        actionValue,
      )

    if (actions.length > 0) {
      return actions
    }
  }

  return []
}


function getIntentAnalysis(result) {
  const output =
    getOutput(result)

  return (
    result?.intentAnalysis ||
    result?.intent_analysis ||
    result?.reasoningAnalysis ||
    result?.reasoning?.analysis ||
    result?.pipeline
      ?.intentAnalysis ||
    output?.intentAnalysis ||
    output?.intent_analysis ||
    output?.reasoningAnalysis ||
    output?.analysis ||
    null
  )
}


function getPlannerDecision(result) {
  const output =
    getOutput(result)

  return (
    result?.plannerDecision ||
    result?.planner_decision ||
    result?.decision ||
    result?.pipeline
      ?.plannerDecision ||
    output?.plannerDecision ||
    output?.planner_decision ||
    output?.decision ||
    null
  )
}


function createExecutionSteps(
  actions,
  moduleId,
) {
  return actions.map(
    (action, index) => ({
      id:
        `ai-brain-v2-step-${index + 1}`,

      index,

      order:
        index + 1,

      plannerId:
        moduleId ||
        "ai-brain-v2",

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
              `ai-brain-v2-step-${index}`,
            ],
    }),
  )
}


function getExecutionPlan({
  result,
  actions,
  moduleId,
}) {
  const output =
    getOutput(result)

  const existingPlan =
    result?.executionPlan ||
    result?.execution_plan ||
    result?.pipeline
      ?.executionPlan ||
    output?.executionPlan ||
    output?.execution_plan

  if (existingPlan) {
    return existingPlan
  }

  if (actions.length === 0) {
    return null
  }

  return {
    type:
      "sequential",

    source:
      "ai-brain-v2-session-adapter",

    moduleId,

    totalSteps:
      actions.length,

    actions,

    steps:
      createExecutionSteps(
        actions,
        moduleId,
      ),
  }
}


function getPlan({
  result,
  actions,
  executionPlan,
}) {
  const output =
    getOutput(result)

  const existingPlan =
    result?.plan ||
    result?.capabilityPlan ||
    result?.planning?.plan ||
    output?.plan ||
    output?.capabilityPlan

  if (existingPlan) {
    return existingPlan
  }

  if (
    !executionPlan &&
    actions.length === 0
  ) {
    return null
  }

  return {
    type:
      "ai_brain_v2_plan",

    source:
      "ai-brain-v2-session-adapter",

    actions,

    executionPlan,
  }
}


function createSessionCompatibleResult(
  result,
) {
  const safeResult =
    normalizeObject(result)

  const moduleId =
    safeResult?.module?.id ||
    safeResult?.selectedModule?.id ||
    "conversation"

  const actions =
    getActions(safeResult)

  const executionPlan =
    getExecutionPlan({
      result:
        safeResult,

      actions,

      moduleId,
    })

  const plan =
    getPlan({
      result:
        safeResult,

      actions,

      executionPlan,
    })

  const answer =
    getAnswer(safeResult)

  const agent =
    getAgent(safeResult)

  const reason =
    getReason(safeResult)

  const intentAnalysis =
    getIntentAnalysis(
      safeResult,
    )

  const plannerDecision =
    getPlannerDecision(
      safeResult,
    )

  return {
    ...safeResult,

    success:
      safeResult.success !==
      false,

    type:
      safeResult.type ||
      safeResult.output?.type ||
      "ai_brain_v2",

    source:
      safeResult.source ||
      "ai-brain-v2",

    answer,

    response:
      answer,

    message:
      answer,

    agent,

    reason,

    plan,

    intentAnalysis,

    plannerDecision,

    executionPlan,

    actions,

    action:
      actions[0] ||
      null,

    sessionAdapter: {
      name:
        "ai-brain-v2-session-adapter",

      version:
        "1.0",

      compatible:
        true,
    },

    brainResult:
      safeResult,
  }
}


function createAIBrainV2Router(
  prisma,
) {
  const router =
    express.Router()


  /*
  =====================================
  STATUS
  =====================================
  */


  router.get(
    "/",
    (req, res) => {
      const modules =
        getBrainModuleInfo()

      res.json({
        success:
          true,

        service:
          "Wood-Booster AI Brain V2",

        status:
          "ready",

        endpoint:
          "/api/ai-brain-v2/chat",

        sessionAdapter: {
          enabled:
            true,

          version:
            "1.0",
        },

        modules,
      })
    },
  )


  /*
  =====================================
  CHAT
  =====================================
  */


  router.post(
    "/chat",
    async (req, res, next) => {
      try {
        const message =
          normalizeMessage(
            req.body?.message,
          )

        if (!message) {
          return res
            .status(400)
            .json({
              success:
                false,

              type:
                "invalid_message",

              source:
                "ai-brain-v2-api",

              answer:
                "Viesti puuttuu.",

              message:
                "Viesti puuttuu.",

              agent:
                "system",

              reason:
                "Message is required.",

              actions:
                [],

              action:
                null,

              plan:
                null,

              intentAnalysis:
                null,

              plannerDecision:
                null,

              executionPlan:
                null,

              error:
                "Message is required.",

              code:
                "MESSAGE_REQUIRED",
            })
        }

        const source =
          normalizeSource(
            req.body?.source,
          )

        const providedRuntimeContext =
          normalizeObject(
            req.body
              ?.runtimeContext,
          )

        const providedSystemContext =
          normalizeObject(
            req.body
              ?.systemContext,
          )

        const conversation =
          normalizeConversation(
            req.body
              ?.conversation ??
            providedRuntimeContext
              .conversation,
          )

        const runtimeContext = {
          ...providedRuntimeContext,

          prisma,

          conversation,

          systemContext: {
            ...normalizeObject(
              providedRuntimeContext
                .systemContext,
            ),

            ...providedSystemContext,
          },

          requestMetadata: {
            ...normalizeObject(
              providedRuntimeContext
                .requestMetadata,
            ),

            transport:
              "http",

            endpoint:
              "/api/ai-brain-v2/chat",

            source,
          },
        }

        const brainResult =
          await runBrain({
            message,
            source,
            runtimeContext,
          })

        const response =
          createSessionCompatibleResult(
            brainResult,
          )

        const statusCode =
          response.success
            ? 200
            : 400

        return res
          .status(statusCode)
          .json(response)
      } catch (error) {
        next(error)
      }
    },
  )


  return router
}


export {
  createSessionCompatibleResult,
}


export default createAIBrainV2Router
