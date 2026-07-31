/*
=====================================
AI BRAIN V2

KNOWLEDGE MODULE TEST

Tämä testi varmistaa:
- tietokysymys ohjautuu Knowledge Modulelle
- tiedostopohjainen tietohaku toimii
- vastaus palautuu AI Brain v2 -muodossa
=====================================
*/


import {
  clearBrainModules,
  registerBrainModule,
  runBrain,
} from "./services/aiBrainV2/index.js"

import {
  createKnowledgeModule,
} from "./services/aiBrainV2/modules/knowledgeModule.js"


async function runTest() {
  clearBrainModules()

  registerBrainModule(
    createKnowledgeModule(),
  )

  const result =
    await runBrain({
      message:
        "Mitä tiedät Aurora-jokipöydästä?",

      source:
        "knowledge-module-test",
    })

  console.log(
    "\nKNOWLEDGE MODULE RESULT\n",
  )

  console.dir(
    result,
    {
      depth:
        null,
    },
  )

  const testPassed =
    result.success ===
      true &&
    result.status ===
      "completed" &&
    result.module?.id ===
      "knowledge" &&
    result.output?.type ===
      "knowledge_result" &&
    typeof result.output?.answer ===
      "string" &&
    result.output.answer.length >
      0 &&
    Array.isArray(
      result.output?.knowledgeSources,
    )

  if (!testPassed) {
    throw new Error(
      "AI Brain v2 Knowledge Module -testi epäonnistui.",
    )
  }

  console.log(
    "\n✅ AI Brain v2 Knowledge Module -testi onnistui.\n",
  )
}


runTest().catch(
  (error) => {
    console.error(
      "\n❌ AI Brain v2 Knowledge Module -testi epäonnistui:",
      error,
    )

    process.exitCode =
      1
  },
)
