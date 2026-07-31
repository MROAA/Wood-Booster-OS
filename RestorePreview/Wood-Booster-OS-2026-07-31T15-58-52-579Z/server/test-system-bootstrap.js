import {
  bootstrapSystem,
  getBootstrapStatus
} from "./services/llmSystem/core/systemBootstrap.js"



import {
  getSystemModules
} from "./services/llmSystem/core/systemRegistry.js"





console.log("")

console.log(
  "🚀 SYSTEM BOOTSTRAP TEST"
)

console.log(
  "======================="
)





async function runTest(){


  try {


    const result =
      await bootstrapSystem()



    console.log("")

    console.log(
      "BOOT RESULT"
    )


    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    )





    console.log("")

    console.log(
      "BOOT STATUS"
    )


    console.log(
      JSON.stringify(
        getBootstrapStatus(),
        null,
        2
      )
    )





    console.log("")

    console.log(
      "REGISTERED SYSTEM MODULES"
    )



    console.log(
      JSON.stringify(
        getSystemModules(),
        null,
        2
      )
    )





    console.log("")

    console.log(
      "✅ SYSTEM BOOTSTRAP TEST COMPLETE"
    )


  }


  catch(error){


    console.error("")

    console.error(
      "❌ SYSTEM BOOTSTRAP TEST FAILED"
    )


    console.error(
      error
    )


    process.exit(1)


  }


}





runTest()
