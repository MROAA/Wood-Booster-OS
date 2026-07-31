import {
  bootstrapSystem
} from "./services/llmSystem/core/systemBootstrap.js"


import {
  clearContextProviders
} from "./services/llmSystem/core/contextProviders.js"


import {
  registerDefaultContextProviders
} from "./services/llmSystem/providers/registerProviders.js"


import {
  createAIContext
} from "./services/llmSystem/core/contextBridge.js"





console.log("")

console.log(
  "🌉 CONTEXT BRIDGE TEST"
)

console.log(
  "===================="
)





async function runTest(){


  try {


    clearContextProviders()



    console.log("")

    console.log(
      "BOOT SYSTEM"
    )


    await bootstrapSystem()





    registerDefaultContextProviders()





    console.log("")

    console.log(
      "CREATE AI CONTEXT"
    )



    const result =
      await createAIContext({

        message:
          "Suunnittele uusi Wood-Booster projekti",

        source:
          "context-bridge-test"

      })





    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    )





    console.log("")

    console.log(
      "✅ CONTEXT BRIDGE TEST COMPLETE"
    )


  }


  catch(error){


    console.error(
      "❌ CONTEXT BRIDGE TEST FAILED"
    )


    console.error(error)


    process.exit(1)

  }


}





runTest()
