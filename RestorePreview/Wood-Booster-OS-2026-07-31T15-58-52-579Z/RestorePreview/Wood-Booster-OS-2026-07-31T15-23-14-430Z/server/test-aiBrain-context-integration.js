/*
=====================================
WOOD-BOOSTER AI PLATFORM

AI BRAIN V2 CONTEXT INTEGRATION TEST

Tarkistaa:

- Context Engine V2
- Spacemonkey Persona
- Creator Identity
- Finnish Culture
- AI Brain Runtime

Ei tulosta raakaa identiteettidataa.

=====================================
*/


import {
  executeAIRequest,
} from "./services/llmSystem/modules/aiBrain/aiBrainV2Adapter.js"







console.log("")

console.log(
  "🧠 AI BRAIN V2 CONTEXT INTEGRATION TEST"
)

console.log(
  "===================================="
)







const result =
  await executeAIRequest({

    message:
      "Kerro miten Spacemonkey toimii Wood-Booster AI Platformissa.",


    source:
      "context-integration-test"

  })







console.log("")

console.log(
  "RESULT SUMMARY"
)





console.log(
  JSON.stringify(

    {

      success:
        result.success,


      module:
        result.module,


      answerPreview:
        result.output?.answer
          ?.slice(0,500),


      debug:
        result.output?.debug,


      metadata:
        result.metadata,

    },

    null,

    2

  )
)







console.log("")

console.log(
  "✅ AI BRAIN CONTEXT INTEGRATION TEST COMPLETE"
)
