import {
  createBaseContext,
  getContextSummary
} from "./services/llmSystem/core/contextEngine.js"


import {
  bootstrapSystem
} from "./services/llmSystem/core/systemBootstrap.js"


import {
  clearContextProviders
} from "./services/llmSystem/core/contextProviders.js"


import {
  registerDefaultContextProviders
} from "./services/llmSystem/providers/registerProviders.js"





console.log("")

console.log(
  "🧠 CONTEXT ENGINE V2 TEST"
)

console.log(
  "========================"
)





async function runTest(){


  try {


    clearContextProviders()





    console.log("")

    console.log(
      "BOOT SYSTEM"
    )


    await bootstrapSystem()





    console.log("")

    console.log(
      "REGISTER PROVIDERS"
    )


    registerDefaultContextProviders()





    console.log("")

    console.log(
      "CREATE CONTEXT"
    )


    const context =
      await createBaseContext({

        message:
          "Suunnittele seuraava Wood-Booster projekti",

        source:
          "context-engine-v2-test",

        runtimeContext: {

          test:
            true

        }

      })





    console.log(
      JSON.stringify(
        context,
        null,
        2
      )
    )





    console.log("")

    console.log(
      "SUMMARY"
    )


    console.log(
      JSON.stringify(
        getContextSummary(context),
        null,
        2
      )
    )





    console.log("")

    console.log(
      "✅ CONTEXT ENGINE V2 TEST COMPLETE"
    )


  }


  catch(error){


    console.error(
      "❌ CONTEXT ENGINE V2 TEST FAILED"
    )


    console.error(error)


    process.exit(1)


  }


}





runTest()
