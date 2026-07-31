import {
  runSpacemonkey,
} from "./spacemonkeyOrchestrator.js"



function normalizeAIContext({

  message,

  knowledge,

  memory,

  systemContext,

}) {


  return {


    message:


      String(message || ""),



    knowledge:

      Array.isArray(knowledge)
        ? knowledge
        : [],



    memory:

      Array.isArray(memory)
        ? memory
        : [],



    systemContext:

      systemContext || {}

  }


}



function createAdapterResult({

  spacemonkeyResult,

}) {


  return {


    success:
      true,


    agent:
      "spacemonkey",



    source:
      "spacemonkey-ai-brain-adapter",



    intelligence:


    {


      runtime:
        spacemonkeyResult.pipeline.runtime,



      reasoning:
        spacemonkeyResult.pipeline.reasoning,



      decision:
        spacemonkeyResult.pipeline.decision,



      planning:
        spacemonkeyResult.pipeline.planning,



      execution:
        spacemonkeyResult.pipeline.execution,



      reflection:
        spacemonkeyResult.pipeline.reflection

    },


    timestamp:
      new Date().toISOString()


  }


}



async function runSpacemonkeyAdapter({

  message,

  knowledge = [],

  memory = [],

  systemContext = {}

}) {


  const context =
    normalizeAIContext({

      message,

      knowledge,

      memory,

      systemContext

    })



  const result =
    await runSpacemonkey(context)



  return createAdapterResult({

    spacemonkeyResult:
      result

  })


}



export {

  runSpacemonkeyAdapter,

  normalizeAIContext

}
