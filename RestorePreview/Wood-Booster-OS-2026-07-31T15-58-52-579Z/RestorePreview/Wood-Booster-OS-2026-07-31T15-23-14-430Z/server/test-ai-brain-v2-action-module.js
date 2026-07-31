/*
=====================================
AI BRAIN V2

ACTION MODULE TEST

Tämä testi varmistaa:
- yhden navigointikomennon
- usean peräkkäisen komennon
- tavallisen keskustelun ohjautumisen
  Conversation Modulelle
=====================================
*/


import {
  clearBrainModules,
  registerBrainModule,
  runBrain,
} from "./services/aiBrainV2/index.js"

import {
  createActionModule,
} from "./services/aiBrainV2/modules/actionModule.js"


async function runTest() {
  clearBrainModules()

  registerBrainModule(
    createActionModule(),
  )

  const singleActionResult =
    await runBrain({
      message:
        "Avaa projektit",

      source:
        "action-module-test",
    })

  console.log(
    "\nSINGLE ACTION RESULT\n",
  )

  console.dir(
    singleActionResult,
    {
      depth:
        null,
    },
  )

  const multipleActionResult =
    await runBrain({
      message:
        "Avaa projektit ja sitten avaa asiakkaat",

      source:
        "action-module-test",
    })

  console.log(
    "\nMULTIPLE ACTION RESULT\n",
  )

  console.dir(
    multipleActionResult,
    {
      depth:
        null,
    },
  )

  const conversationResult =
    await runBrain({
      message:
        "Miten päiväsi on mennyt?",

      source:
        "action-module-test",
    })

  console.log(
    "\nCONVERSATION RESULT\n",
  )

  console.dir(
    conversationResult,
    {
      depth:
        null,
    },
  )

  const singleActionPassed =
    singleActionResult.success ===
      true &&
    singleActionResult.status ===
      "completed" &&
    singleActionResult.module?.id ===
      "action" &&
    singleActionResult.output?.mode ===
      "single_action" &&
    singleActionResult.output?.action?.path ===
      "/projects"

  const multipleActionPassed =
    multipleActionResult.success ===
      true &&
    multipleActionResult.status ===
      "completed" &&
    multipleActionResult.module?.id ===
      "action" &&
    multipleActionResult.output?.mode ===
      "action_plan" &&
    multipleActionResult.output?.actions?.length ===
      2 &&
    multipleActionResult.output?.actions?.[0]?.path ===
      "/projects" &&
    multipleActionResult.output?.actions?.[1]?.path ===
      "/customers"

  const conversationPassed =
    conversationResult.success ===
      true &&
    conversationResult.status ===
      "completed" &&
    conversationResult.module?.id ===
      "conversation" &&
    conversationResult.output?.type ===
      "conversation_result" &&
    typeof conversationResult.output?.answer ===
      "string" &&
    conversationResult.output.answer.length >
      0

  if (
    !singleActionPassed ||
    !multipleActionPassed ||
    !conversationPassed
  ) {
    throw new Error(
      "AI Brain v2 Action Module -testi epäonnistui.",
    )
  }

  console.log(
    "\n✅ AI Brain v2 Action Module -testi onnistui.\n",
  )
}


runTest().catch(
  (error) => {
    console.error(
      "\n❌ AI Brain v2 Action Module -testi epäonnistui:",
      error,
    )

    process.exitCode =
      1
  },
)
