import {
  startLLMSystem
} from "./services/llmSystem/bootstrap.js"



import {
  getModule
} from "./services/llmSystem/modules/moduleRegistry.js"





console.log("")

console.log(
  "🧠 LLM MODULE EXECUTION TEST"
)

console.log(
  "==========================="
)





async function runTest(){


  try {


    await startLLMSystem()



    const spacemonkey =
      getModule(
        "spacemonkey"
      )



    const aiBrain =
      getModule(
        "aiBrain"
      )





    console.log("")

    console.log(
      "SPACEMONKEY TEST"
    )


    const spacemonkeyResult =
      await spacemonkey.execute({

        action:
          "identity"

      })



    console.log(
      JSON.stringify(
        spacemonkeyResult,
        null,
        2
      )
    )





    console.log("")

    console.log(
      "AI BRAIN TEST"
    )



    const aiBrainResult =
      await aiBrain.execute({

        action:
          "capabilities"

      })



    console.log(
      JSON.stringify(
        aiBrainResult,
        null,
        2
      )
    )





    console.log("")

    console.log(
      "✅ MODULE EXECUTION TEST COMPLETE"
    )


  }

  catch(error){


    console.error("")

    console.error(
      "❌ MODULE TEST FAILED"
    )


    console.error(
      error
    )


    process.exit(1)


  }


}





runTest()
