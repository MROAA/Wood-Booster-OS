/*
=====================================
WOOD-BOOSTER AI BRAIN V2

DECISION MODULE TEST

Testaa:
- Action-päätöksen
- Memory-päätöksen
- Knowledge-päätöksen
- Conversation-päätöksen
- Clarify-päätöksen
- Decision Modulen canHandle-logiikan
=====================================
*/


import {
  createDecision,
  createDecisionModule,
} from "./services/aiBrainV2/modules/decisionModule.js"


function assert(
  condition,
  message,
) {
  if (!condition) {
    throw new Error(
      message,
    )
  }
}


function printDecision({
  title,
  decision,
}) {
  console.log(
    `\n=== ${title} ===`,
  )

  console.log(
    JSON.stringify(
      decision,
      null,
      2,
    ),
  )
}


async function runTest() {
  console.log(
    "\nWOOD-BOOSTER AI BRAIN V2",
  )

  console.log(
    "DECISION MODULE TEST\n",
  )


  const actionDecision =
    createDecision({
      intent:
        "action_request",

      domains: [
        "project",
      ],

      isQuestion:
        false,

      requiresAction:
        true,

      moduleNeeds: {
        action:
          true,

        memory:
          false,

        knowledge:
          false,

        conversation:
          false,

        project:
          true,

        customer:
          false,
      },

      missingInformation: [],

      confidence:
        0.75,
    })

  printDecision({
    title:
      "ACTION DECISION",

    decision:
      actionDecision,
  })

  assert(
    actionDecision.decision ===
      "delegate",

    "Action-päätöksen pitäisi olla delegate.",
  )

  assert(
    actionDecision.targetModule ===
      "action",

    "Action-päätöksen kohdemoduulin pitäisi olla action.",
  )


  const memoryDecision =
    createDecision({
      intent:
        "memory_action",

      domains: [
        "memory",
      ],

      isQuestion:
        false,

      requiresAction:
        true,

      moduleNeeds: {
        action:
          true,

        memory:
          true,

        knowledge:
          false,

        conversation:
          false,

        project:
          false,

        customer:
          false,
      },

      missingInformation: [],

      confidence:
        0.8,
    })

  printDecision({
    title:
      "MEMORY DECISION",

    decision:
      memoryDecision,
  })

  assert(
    memoryDecision.decision ===
      "delegate",

    "Memory-päätöksen pitäisi olla delegate.",
  )

  assert(
    memoryDecision.targetModule ===
      "memory",

    "Memory-päätöksen kohdemoduulin pitäisi olla memory.",
  )


  const knowledgeDecision =
    createDecision({
      intent:
        "information_request",

      domains: [
        "knowledge",
      ],

      isQuestion:
        true,

      requiresAction:
        false,

      moduleNeeds: {
        action:
          false,

        memory:
          false,

        knowledge:
          true,

        conversation:
          true,

        project:
          false,

        customer:
          false,
      },

      missingInformation: [],

      confidence:
        0.7,
    })

  printDecision({
    title:
      "KNOWLEDGE DECISION",

    decision:
      knowledgeDecision,
  })

  assert(
    knowledgeDecision.decision ===
      "delegate",

    "Knowledge-päätöksen pitäisi olla delegate.",
  )

  assert(
    knowledgeDecision.targetModule ===
      "knowledge",

    "Knowledge-päätöksen kohdemoduulin pitäisi olla knowledge.",
  )


  const conversationDecision =
    createDecision({
      intent:
        "conversation",

      domains: [
        "general",
      ],

      isQuestion:
        false,

      requiresAction:
        false,

      moduleNeeds: {
        action:
          false,

        memory:
          false,

        knowledge:
          false,

        conversation:
          true,

        project:
          false,

        customer:
          false,
      },

      missingInformation: [],

      confidence:
        0.4,
    })

  printDecision({
    title:
      "CONVERSATION DECISION",

    decision:
      conversationDecision,
  })

  assert(
    conversationDecision.decision ===
      "respond",

    "Conversation-päätöksen pitäisi olla respond.",
  )

  assert(
    conversationDecision.targetModule ===
      "conversation",

    "Conversation-päätöksen kohdemoduulin pitäisi olla conversation.",
  )


  const clarifyDecision =
    createDecision({
      intent:
        "action_request",

      domains: [
        "project",
      ],

      isQuestion:
        false,

      requiresAction:
        true,

      moduleNeeds: {
        action:
          true,

        memory:
          false,

        knowledge:
          false,

        conversation:
          false,

        project:
          true,

        customer:
          false,
      },

      missingInformation: [
        "action_details",
      ],

      confidence:
        0.5,
    })

  printDecision({
    title:
      "CLARIFY DECISION",

    decision:
      clarifyDecision,
  })

  assert(
    clarifyDecision.decision ===
      "clarify",

    "Puuttuvien tietojen pitäisi tuottaa clarify-päätös.",
  )

  assert(
    clarifyDecision.targetModule ===
      null,

    "Clarify-päätöksellä ei saa olla kohdemoduulia.",
  )


  const invalidDecision =
    createDecision(
      null,
    )

  printDecision({
    title:
      "INVALID ANALYSIS",

    decision:
      invalidDecision,
  })

  assert(
    invalidDecision.decision ===
      "clarify",

    "Puuttuvan analyysin pitäisi tuottaa clarify-päätös.",
  )

  assert(
    invalidDecision.missingInformation
      .includes(
        "reasoning_analysis",
      ),

    "Puuttuvan analyysin pitäisi ilmoittaa reasoning_analysis.",
  )


  const module =
    createDecisionModule()

  const normalCanHandle =
    await module.canHandle({
      request: {
        message:
          "Luo projekti.",
      },

      runtimeContext: {},
    })

  assert(
    normalCanHandle.matched ===
      false,

    "Decision Module ei saa osallistua oletusreititykseen vielä.",
  )


  const explicitCanHandle =
    await module.canHandle({
      request: {
        message:
          "Luo projekti.",
      },

      runtimeContext: {
        decisionOnly:
          true,

        reasoningAnalysis: {
          intent:
            "action_request",

          domains: [
            "project",
          ],

          requiresAction:
            true,

          moduleNeeds: {
            action:
              true,
          },

          missingInformation: [],

          confidence:
            0.75,
        },
      },
    })

  assert(
    explicitCanHandle.matched ===
      true,

    "Decision Modulen pitäisi hyväksyä decisionOnly-pyyntö.",
  )


  const executionResult =
    await module.execute({
      request: {
        requestId:
          "decision-test-1",

        message:
          "Luo projekti.",
      },

      runtimeContext: {
        decisionOnly:
          true,

        reasoningAnalysis: {
          intent:
            "action_request",

          domains: [
            "project",
          ],

          requiresAction:
            true,

          moduleNeeds: {
            action:
              true,
          },

          missingInformation: [],

          confidence:
            0.75,
        },
      },
    })

  assert(
    executionResult.type ===
      "decision_result",

    "Decision Module palautti väärän tulostyypin.",
  )

  assert(
    executionResult.decision ===
      "delegate",

    "Decision Module ei muodostanut delegate-päätöstä.",
  )

  assert(
    executionResult.targetModule ===
      "action",

    "Decision Module ei valinnut Action Modulea.",
  )


  console.log(
    "\n✅ AI Brain v2 Decision Module -testi onnistui.\n",
  )
}


runTest()
  .catch(
    (error) => {
      console.error(
        "\n❌ Decision Module -testi epäonnistui.",
      )

      console.error(
        error,
      )

      process.exitCode = 1
    },
  )
