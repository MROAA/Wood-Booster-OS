import {
  executeAIRequest,
  health
} from "./services/llmSystem/modules/aiBrain/aiBrainV2Adapter.js"



console.log("")

console.log(
  "🧠 AI BRAIN V2 ADAPTER TEST"
)

console.log(
  "========================="
)





async function runTest(){


  try {


    console.log("")

    console.log(
      "ADAPTER HEALTH"
    )


    const healthResult =
      await health()



    console.log(
      JSON.stringify(
        healthResult,
        null,
        2
      )
    )





    console.log("")

    console.log(
      "BRAIN EXECUTION TEST"
    )



    const result =
      await executeAIRequest({

        message:
          "Testaa AI Brain V2 adapteri",

        source:
          "llmSystem-test",

        runtimeContext:{

          test:true

        }

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
      "✅ AI BRAIN V2 ADAPTER TEST COMPLETE"
    )


  }

  catch(error){


    console.error("")

    console.error(
      "❌ AI BRAIN V2 ADAPTER TEST FAILED"
    )


    console.error(
      error
    )


    process.exit(1)

  }


}





runTest()
