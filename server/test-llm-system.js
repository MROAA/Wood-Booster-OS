import {
  startLLMSystem,
  getBootstrapStatus
} from "./services/llmSystem/bootstrap.js"



console.log(
  ""
)

console.log(
  "🧠 LLM SYSTEM TEST"
)

console.log(
  "================="
)



async function runTest(){


  try {


    const startResult =
      await startLLMSystem()



    console.log(
      ""
    )

    console.log(
      "START RESULT"
    )

    console.log(
      startResult
    )




    const status =
      await getBootstrapStatus()



    console.log(
      ""
    )

    console.log(
      "SYSTEM STATUS"
    )

    console.log(
      JSON.stringify(
        status,
        null,
        2
      )
    )



    console.log(
      ""
    )

    console.log(
      "✅ LLM SYSTEM TEST COMPLETE"
    )


  }

  catch(error){


    console.error(
      ""
    )


    console.error(
      "❌ LLM SYSTEM TEST FAILED"
    )


    console.error(
      error
    )


    process.exit(
      1
    )


  }


}



runTest()
