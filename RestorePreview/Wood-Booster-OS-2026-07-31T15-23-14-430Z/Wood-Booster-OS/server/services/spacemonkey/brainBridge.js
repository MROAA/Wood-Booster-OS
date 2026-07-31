/*
  Spacemonkey Brain Bridge

  Yhdistää Spacemonkey Runtime
  AI Brain V2 Runtimeen.

  Vastuu:
  - vastaanottaa Spacemonkey tilan
  - välittää system contextin Brainille
  - lisää Memory Contextin
  - kutsua AI Brain V2 runtimea
  - palauttaa Brain tuloksen

  Ei:
  - muuta AI Brain logiikkaa
  - kutsu Ollamaa suoraan
  - päätä vastauksia
  - kirjoita muistia
*/


import {
  runBrainRuntime,
} from "../aiBrainV2/brainRuntime.js"


import {
  createSpacemonkeyContextText,
} from "./contextAdapter.js"


import {
  createMemoryBrainBridge,
} from "../aiBrainV2/services/memoryBrainBridge.js"



async function runSpacemonkeyBrain({

  runtime,

} = {}) {


  if (!runtime) {

    throw new Error(
      "Spacemonkey runtime puuttuu"
    )

  }



  const spacemonkeyContext =
    createSpacemonkeyContextText({

      spacemonkey:
        runtime.spacemonkey,

    })



  const systemContext =
    runtime.systemContext ||
    ""



  console.log(
    "SPACEMONKEY CONTEXT READY"
  )


  console.log(
    "SPACEMONKEY SYSTEM CONTEXT:",
    systemContext.length,
  )



  let finalRuntimeContext = {

    spacemonkey:
      runtime.spacemonkey,


    spacemonkeyRuntime:
      runtime.runtime,


    spacemonkeyContext,


    systemContext,

  }



  if (
    runtime.runtime.prisma
  ) {


    const memoryResult =
      await createMemoryBrainBridge({

        prisma:
          runtime.runtime.prisma,


        query:
          runtime.runtime.userMessage,


        runtimeContext:
          finalRuntimeContext,

      })



    if (
      memoryResult.success
    ) {

      finalRuntimeContext =
        memoryResult.runtimeContext


      console.log(
        "SPACEMONKEY MEMORY CONTEXT READY",
        memoryResult.memories.length,
      )

    }

  }



  const result =
    await runBrainRuntime({

      message:
        runtime.runtime.userMessage,


      source:
        "spacemonkey",


      runtimeContext:
        finalRuntimeContext,

    })


  return result

}



export {

  runSpacemonkeyBrain,

}
