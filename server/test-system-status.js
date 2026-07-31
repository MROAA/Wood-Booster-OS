import {
  bootstrapSystem
} from "./services/llmSystem/core/systemBootstrap.js"


import {
  getSystemStatus
} from "./services/llmSystem/core/systemStatus.js"





console.log("")

console.log(
  "📊 SYSTEM STATUS TEST"
)

console.log(
  "==================="
)





async function runTest(){


  try {


    console.log("")

    console.log(
      "BOOT SYSTEM"
    )



    const boot =
      await bootstrapSystem()



    console.log(
      JSON.stringify(
        boot,
        null,
        2
      )
    )





    console.log("")

    console.log(
      "CURRENT SYSTEM STATUS"
    )



    const status =
      getSystemStatus()



    console.log(
      JSON.stringify(
        status,
        null,
        2
      )
    )





    console.log("")

    console.log(
      "✅ SYSTEM STATUS TEST COMPLETE"
    )


  }


  catch(error){


    console.error("")

    console.error(
      "❌ SYSTEM STATUS TEST FAILED"
    )


    console.error(
      error
    )


    process.exit(1)

  }


}





runTest()
