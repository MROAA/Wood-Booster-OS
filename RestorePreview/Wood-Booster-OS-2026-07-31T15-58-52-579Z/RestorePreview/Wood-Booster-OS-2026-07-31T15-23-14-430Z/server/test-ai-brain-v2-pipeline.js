/*
=====================================
WOOD-BOOSTER AI BRAIN V2

BRAIN PIPELINE TEST

Testaa:
- Reasoning-vaiheen
- Decision-vaiheen
- kohdemoduulin suorittamisen
- Action Module -ketjun
- Conversation Module -ketjun
- Clarification-pysäytyksen
- tyhjän viestin validoinnin
=====================================
*/


import {
  runBrainPipeline,
} from "./services/aiBrainV2/brainPipeline.js"


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


async function testActionPipeline() {
  const result =
    await runBrainPipeline({
      message:
        "Avaa projektit",

      source:
        "pipeline-action-test",
    })


  printResult({
    title:
      "ACTION PIPELINE",

    result,
  })


  assert(
    result.success ===
      true,

    "Action Pipeline epäonnistui.",
  )


  assert(
    result.status ===
      "completed",

    "Action Pipelinen status ei ole completed.",
  )


  assert(
    result.stages.reasoning
      ?.module?.id ===
      "reasoning",

    "Reasoning Module ei suorittunut.",
  )


  assert(
    result.stages.decision
      ?.module?.id ===
      "decision",

    "Decision Module ei suorittunut.",
  )


  assert(
    result.stages.decision
      ?.output?.targetModule ===
      "action",

    "Decision Module ei valinnut Action Modulea.",
  )


  assert(
    result.stages.execution
      ?.module?.id ===
      "action",

    "Action Module ei suorittunut.",
  )


  assert(
    result.finalOutput?.type ===
      "action_result",

    "Action Pipeline palautti väärän tulostyypin.",
  )


  assert(
    result.finalOutput?.actions
      ?.length > 0,

    "Action Pipeline ei palauttanut toimintoa.",
  )
}


async function testConversationPipeline() {
  const result =
    await runBrainPipeline({
      message:
        "Hei AI Brain",

      source:
        "pipeline-conversation-test",
    })


  printResult({
    title:
      "CONVERSATION PIPELINE",

    result,
  })


  assert(
    result.success ===
      true,

    "Conversation Pipeline epäonnistui.",
  )


  assert(
    result.status ===
      "completed",

    "Conversation Pipelinen status ei ole completed.",
  )


  assert(
    result.stages.decision
      ?.output?.decision ===
      "respond",

    "Decision Module ei muodostanut respond-päätöstä.",
  )


  assert(
    result.stages.decision
      ?.output?.targetModule ===
      "conversation",

    "Decision Module ei valinnut Conversation Modulea.",
  )


  assert(
    result.stages.execution
      ?.module?.id ===
      "conversation",

    "Conversation Module ei suorittunut.",
  )


  assert(
    result.finalOutput !==
      null,

    "Conversation Pipeline ei palauttanut vastausta.",
  )
}


async function testClarificationPipeline() {
  const result =
    await runBrainPipeline({
      message:
        "Luo",

      source:
        "pipeline-clarification-test",
    })


  printResult({
    title:
      "CLARIFICATION PIPELINE",

    result,
  })


  assert(
    result.success ===
      true,

    "Clarification Pipeline epäonnistui.",
  )


  assert(
    result.status ===
      "clarification_required",

    "Pipeline ei pysähtynyt clarification-tilaan.",
  )


  assert(
    result.stages.reasoning !==
      null,

    "Clarification-testissä Reasoning-vaihe puuttuu.",
  )


  assert(
    result.stages.decision !==
      null,

    "Clarification-testissä Decision-vaihe puuttuu.",
  )


  assert(
    result.stages.execution ===
      null,

    "Clarification-tilassa kohdemoduulia ei saa suorittaa.",
  )


  assert(
    result.finalOutput?.type ===
      "clarification_result",

    "Clarification Pipeline palautti väärän tulostyypin.",
  )


  assert(
    result.finalOutput
      ?.missingInformation
      ?.includes(
        "action_details",
      ),

    "Clarification Pipeline ei ilmoittanut puuttuvia toimintotietoja.",
  )
}


async function testInvalidMessage() {
  const result =
    await runBrainPipeline({
      message:
        "   ",

      source:
        "pipeline-invalid-test",
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
    result.error?.code ===
      "INVALID_MESSAGE",

    "Tyhjän viestin virhekoodi on väärä.",
  )
}


async function runTest() {
  console.log(
    "\nWOOD-BOOSTER AI BRAIN V2",
  )

  console.log(
    "BRAIN PIPELINE TEST\n",
  )


  await testActionPipeline()

  await testConversationPipeline()

  await testClarificationPipeline()

  await testInvalidMessage()


  console.log(
    "\n✅ AI Brain v2 Brain Pipeline -testi onnistui.\n",
  )
}


runTest()
  .catch(
    (error) => {
      console.error(
        "\n❌ Brain Pipeline -testi epäonnistui.",
      )

      console.error(
        error,
      )

      process.exitCode = 1
    },
  )
