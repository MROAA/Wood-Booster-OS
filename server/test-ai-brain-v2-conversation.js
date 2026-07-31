import {
  clearBrainModules,
  getBrainModuleInfo,
  runBrain,
} from "./services/aiBrainV2/index.js"

import {
  registerDefaultBrainModules,
} from "./services/aiBrainV2/registerDefaultModules.js"


async function runTest() {
  clearBrainModules()

  registerDefaultBrainModules()

  console.log(
    "\nREGISTERED MODULES\n",
  )

  console.dir(
    getBrainModuleInfo(),
    {
      depth:
        null,
    },
  )

  const result =
    await runBrain({
      message:
        "Vastaa lyhyesti: mikä on Wood-Booster?",

      source:
        "conversation-integration-test",

      runtimeContext: {
        knowledge:
          [],

        conversation:
          [],

        prisma:
          null,
      },
    })

  console.log(
    "\nCONVERSATION RESULT\n",
  )

  console.dir(
    result,
    {
      depth:
        null,
    },
  )

  const passed =
    result.success ===
      true &&
    result.status ===
      "completed" &&
    result.module?.id ===
      "conversation" &&
    typeof result.output?.answer ===
      "string" &&
    result.output.answer.length >
      0

  if (!passed) {
    throw new Error(
      "AI Brain v2 Conversation Module -testi epäonnistui.",
    )
  }

  console.log(
    "\n✅ AI Brain v2 Conversation Module -testi onnistui.\n",
  )
}


runTest().catch(
  (error) => {
    console.error(
      "\n❌ AI Brain v2 Conversation Module -testi epäonnistui:",
      error,
    )

    process.exitCode =
      1
  },
)
