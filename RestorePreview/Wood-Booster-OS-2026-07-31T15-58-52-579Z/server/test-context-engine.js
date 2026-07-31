import {
  bootstrapSystem
} from "./services/llmSystem/core/systemBootstrap.js"



import {
  createBaseContext,
  getContextSummary
} from "./services/llmSystem/core/contextEngine.js"





console.log("")

console.log(
  "🧠 CONTEXT ENGINE TEST"
)

console.log(
  "===================="
)





async function runTest(){


  try {


    console.log("")

    console.log(
      "BOOT SYSTEM"
    )


    await bootstrapSystem()





    console.log("")

    console.log(
      "CREATE CONTEXT"
    )



    const context =
      createBaseContext({

        message:
          "Suunnittele seuraava Wood-Booster projekti",

        source:
          "context-test",

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
      "CONTEXT SUMMARY"
    )



    console.log(
      JSON.stringify(
        getContextSummary(
          context
        ),
        null,
        2
      )
    )





    console.log("")

    console.log(
      "✅ CONTEXT ENGINE TEST COMPLETE"
    )


  }


  catch(error){


    console.error("")

    console.error(
      "❌ CONTEXT ENGINE TEST FAILED"
    )


    console.error(
      error
    )


    process.exit(1)


  }


}





runTest()
