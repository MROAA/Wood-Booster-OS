/*
=====================================
WOOD-BOOSTER AI BRAIN V2

BRAIN ORCHESTRATOR TEST

Testaa:
- Action-pyynnön
- Conversation-pyynnön
- Clarification-tilan
- Tyhjän viestin
- Orchestrator-metadatan
=====================================
*/


import {
  runBrainOrchestrator,
} from "./services/aiBrainV2/brainOrchestrator.js"


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


function printResult({
  title,
  result,
}) {
  console.log(
    `\n=== ${title} ===\n`,
  )

  console.dir(
    result,
    {
      depth:
        null,
    },
  )
}


async function testActionOrchestrator() {
  const result =
    await runBrainOrchestrator({
      message:
        "Avaa projektit",

      source:
        "orchestrator-action-test",

      runtimeContext: {
        testMode:
          true,
      },
    })


  printResult({
    title:
      "ACTION ORCHESTRATOR",

    result,
  })


  assert(
    result.success ===
      true,

    "Action Orchestrator epäonnistui.",
  )


  assert(
    result.status ===
      "completed",

    "Action Orchestratorin status ei ole completed.",
  )


  assert(
    result.metadata
      ?.orchestrator ===
      true,

    "Orchestrator-metadata puuttuu.",
  )


  assert(
    result.metadata
      ?.pipelineExecuted ===
      true,

    "Pipelinea ei merkitty suoritetuksi.",
  )


  assert(
    result.pipelineResult
      ?.stages
      ?.reasoning
      ?.module
      ?.id ===
      "reasoning",

    "Reasoning Module ei suorittunut Orchestratorin kautta.",
  )


  assert(
    result.pipelineResult
      ?.stages
      ?.decision
      ?.module
      ?.id ===
      "decision",

    "Decision Module ei suorittunut Orchestratorin kautta.",
  )


  assert(
    result.pipelineResult
      ?.stages
      ?.execution
      ?.module
      ?.id ===
      "action",

    "Action Module ei suorittunut Orchestratorin kautta.",
  )


  assert(
    result.finalOutput
      ?.type ===
      "action_result",

    "Action Orchestrator palautti väärän tulostyypin.",
  )


  assert(
    result.finalOutput
      ?.action
      ?.path ===
      "/projects",

    "Action Orchestrator palautti väärän navigointipolun.",
  )
}


async function testConversationOrchestrator() {
  const result =
    await runBrainOrchestrator({
      message:
        "Hei AI Brain",

      source:
        "orchestrator-conversation-test",
    })


  printResult({
    title:
      "CONVERSATION ORCHESTRATOR",

    result,
  })


  assert(
    result.success ===
      true,

    "Conversation Orchestrator epäonnistui.",
  )


  assert(
    result.status ===
      "completed",

    "Conversation Orchestratorin status ei ole completed.",
  )


  assert(
    result.pipelineResult
      ?.stages
      ?.decision
      ?.output
      ?.decision ===
      "respond",

    "Decision Module ei muodostanut respond-päätöstä.",
  )


  assert(
    result.pipelineResult
      ?.stages
      ?.execution
      ?.module
      ?.id ===
      "conversation",

    "Conversation Module ei suorittunut Orchestratorin kautta.",
  )


  assert(
    result.finalOutput
      ?.type ===
      "conversation_result",

    "Conversation Orchestrator palautti väärän tulostyypin.",
  )


  assert(
    typeof result.finalOutput
      ?.answer ===
      "string" &&
    result.finalOutput.answer
      .trim()
      .length > 0,

    "Conversation Orchestrator ei palauttanut vastausta.",
  )
}


async function testClarificationOrchestrator() {
  const result =
    await runBrainOrchestrator({
      message:
        "Luo",

      source:
        "orchestrator-clarification-test",
    })


  printResult({
    title:
      "CLARIFICATION ORCHESTRATOR",

    result,
  })


  assert(
    result.success ===
      true,

    "Clarification Orchestrator epäonnistui.",
  )


  assert(
    result.status ===
      "clarification_required",

    "Orchestrator ei palauttanut clarification_required-tilaa.",
  )


  assert(
    result.metadata
      ?.clarificationRequired ===
      true,

    "Clarification-metadata puuttuu.",
  )


  assert(
    result.pipelineResult
      ?.stages
      ?.execution ===
      null,

    "Clarification-tilassa kohdemoduulia ei saa suorittaa.",
  )


  assert(
    result.finalOutput
      ?.type ===
      "clarification_result",

    "Clarification Orchestrator palautti väärän tulostyypin.",
  )


  assert(
    result.finalOutput
      ?.missingInformation
      ?.includes(
        "action_details",
      ),

    "Clarification Orchestrator ei ilmoittanut puuttuvia toimintotietoja.",
  )
}


async function testInvalidMessage() {
  const result =
    await runBrainOrchestrator({
      message:
        "   ",

      source:
        "orchestrator-invalid-test",
    })


  printResult({
    title:
      "INVALID MESSAGE",

    result,
  })


  assert(
    result.success ===
      false,

    "Tyhjän viestin käsittely ei saa onnistua.",
  )


  assert(
    result.status ===
      "invalid_request",

    "Tyhjän viestin status on väärä.",
  )


  assert(
    result.error
      ?.code ===
      "INVALID_MESSAGE",

    "Tyhjän viestin virhekoodi on väärä.",
  )


  assert(
    result.metadata
      ?.pipelineExecuted ===
      false,

    "Pipelinea ei saa suorittaa tyhjälle viestille.",
  )
}


async function runTest() {
  console.log(
    "\nWOOD-BOOSTER AI BRAIN V2",
  )

  console.log(
    "BRAIN ORCHESTRATOR TEST\n",
  )


  await testActionOrchestrator()

  await testConversationOrchestrator()

  await testClarificationOrchestrator()

  await testInvalidMessage()


  console.log(
    "\n✅ AI Brain v2 Brain Orchestrator -testi onnistui.\n",
  )
}


runTest()
  .catch(
    (error) => {
      console.error(
        "\n❌ Brain Orchestrator -testi epäonnistui.",
      )

      console.error(
        error,
      )

      process.exitCode = 1
    },
  )
