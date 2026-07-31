import {
  executeAIBrainRequest,
  getBridgeStatus
} from "./services/llmSystem/modules/aiBrain/aiBrainBridge.js"



console.log("")

console.log(
  "🧠 AI BRAIN BRIDGE TEST"
)

console.log(
  "======================"
)





async function runTest(){


  try {


    console.log("")

    console.log(
      "BRIDGE STATUS"
    )


    console.log(
      JSON.stringify(
        getBridgeStatus(),
        null,
        2
      )
    )





    console.log("")

    console.log(
      "EXECUTION TEST"
    )



    const result =
      await executeAIBrainRequest({

        message:
          "Test message"

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
      "✅ AI BRAIN BRIDGE TEST COMPLETE"
    )


  }

  catch(error){


    console.error("")

    console.error(
      "❌ BRIDGE TEST FAILED"
    )


    console.error(
      error
    )


    process.exit(1)

  }


}



runTest()
