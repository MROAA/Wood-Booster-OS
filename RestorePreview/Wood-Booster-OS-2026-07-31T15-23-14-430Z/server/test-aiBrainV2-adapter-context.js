import {
  executeAIRequest,
} from "./services/llmSystem/modules/aiBrain/aiBrainV2Adapter.js"


console.log(`
🧠 AI BRAIN V2 ADAPTER CONTEXT TEST
==================================
`)


const result =
  await executeAIRequest({

    message:
      "Testaa Spacemonkey identiteetti",

    source:
      "adapter-context-test",

    runtimeContext: {

      model:
        "qwen2.5:7b"

    }

  })


console.log(
  "RESULT"
)


console.log(
  JSON.stringify(
    result,
    null,
    2,
  )
)


console.log(`
✅ ADAPTER CONTEXT TEST COMPLETE
`)
