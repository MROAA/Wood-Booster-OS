/*
=====================================

Spacemonkey Brain Bridge V2

Yhdistää:

Spacemonkey Runtime
        |
        v
AI Brain V2 Runtime

Vastuut:

- vastaanottaa Spacemonkey tilan
- välittää system contextin
- lisää Memory Contextin
- lisää Context Engine metadataa
- kutsuu AI Brain V2 runtimea
- palauttaa Brain tuloksen


Ei:

- muuta AI Brain logiikkaa
- kutsu Ollamaa suoraan
- päätä vastauksia
- kirjoita muistia


=====================================
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



    contextMetadata: {

      providers: [

        "system",

        "identity",

        "memory",

        "knowledge",

        "finnishCulture",

        "spacemonkeyPersona",

        "creator_identity",

      ],



      spacemonkeyPersona:
        true,



      creatorIdentity:
        true,



      finnishCulture:
        true,

    },


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
