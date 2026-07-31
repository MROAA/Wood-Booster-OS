/*
=====================================
AI BRAIN V2

AUTOMATIC MODULE REGISTRATION TEST

Tämä testi varmistaa, että:
- moduulirekisteri voidaan tyhjentää
- runBrain rekisteröi oletusmoduulit
- oikea Conversation Module suoritetaan
- nykyinen aiBrain.js ja Ollama toimivat
=====================================
*/


import {
  clearBrainModules,
  getBrainModuleInfo,
  runBrain,
} from "./services/aiBrainV2/index.js"


async function runTest() {
  clearBrainModules()

  console.log(
    "\nMODULES BEFORE RUN\n",
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
        "Vastaa yhdellä lyhyellä lauseella: mikä Wood-Booster on?",

      source:
        "auto-registration-test",

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
    "\nMODULES AFTER RUN\n",
  )

  console.dir(
    getBrainModuleInfo(),
    {
      depth:
        null,
    },
  )

  console.log(
    "\nRESULT\n",
  )

  console.dir(
    result,
    {
      depth:
        null,
    },
  )

  const modules =
    getBrainModuleInfo()

  const conversationModule =
    modules.find(
      (module) =>
        module.id ===
        "conversation",
    )

  const passed =
    conversationModule?.priority ===
      1000 &&
    result.success ===
      true &&
    result.status ===
      "completed" &&
    result.module?.id ===
      "conversation" &&
    result.output?.type ===
      "conversation_result" &&
    typeof result.output?.answer ===
      "string" &&
    result.output.answer.length >
      0

  if (!passed) {
    throw new Error(
      "AI Brain v2:n automaattinen moduulirekisteröinti epäonnistui.",
    )
  }

  console.log(
    "\n✅ AI Brain v2 automaattinen rekisteröinti onnistui.\n",
  )
}


runTest().catch(
  (error) => {
    console.error(
      "\n❌ Testi epäonnistui:",
      error,
    )

    process.exitCode =
      1
  },
)
