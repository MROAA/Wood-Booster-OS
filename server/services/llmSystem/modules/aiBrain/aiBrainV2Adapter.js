/*
=====================================

AI BRAIN V2 ADAPTER

LLM SYSTEM BRIDGE

Yhdistää:

Request
 |
 v
Spacemonkey Runtime
 |
 v
Context Engine
 |
 v
AI Brain V2


Ei:

- ei tee päätöksiä
- ei kutsu mallia
- ei ohita Brain Pipelinea
- ei kirjoita muistia

=====================================
*/


import {
  runBrain,
} from "../../../aiBrainV2/index.js"



import {
  injectContextEngineContext,
} from "../../../aiBrainV2/services/contextEngineInjectionAdapter.js"



import {
  injectSpacemonkeyRuntime,
} from "../../../spacemonkey/spacemonkeyRuntimeAdapter.js"







async function executeAIRequest({

  message,

  source =
    "llmSystem",

  runtimeContext = {},

} = {}) {



  const spacemonkeyRuntimeContext =

    injectSpacemonkeyRuntime({

      runtimeContext,

    })







  const enhancedRuntimeContext =

    await injectContextEngineContext({

      message,

      source,

      runtimeContext:
        spacemonkeyRuntimeContext,

    })







  return runBrain({

    message,

    source,

    runtimeContext:
      enhancedRuntimeContext,

  })


}







async function health(){


  return {

    status:
      "READY",


    module:
      "aiBrainV2Adapter",


    target:
      "AI Brain V2",


    spacemonkeyRuntime:
      "ACTIVE",


    contextEngine:
      "ACTIVE",


    contextInjection:
      "ACTIVE"

  }


}







export {

  executeAIRequest,

  health,

}
