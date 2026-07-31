/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY BRAIN BRIDGE V2

Vastuut:

- yhdistää muistikerroksen osat
- valmistaa AI Brainille runtimeContextin
- säilyttää muistien metatiedot

Ketju:

Query
 |
Memory Context Provider
 |
Runtime Injection
 |
AI Brain Context

Tämä EI:

- muuta Brain Pipelinea
- kirjoita muistia
- päätä muistojen sisältöä

=====================================
*/


import {
  createMemoryContextProvider,
} from "./memoryContextProvider.js"


import {
  injectMemoryRuntimeContext,
} from "./memoryRuntimeInjectionAdapter.js"



async function createMemoryBrainBridge({
  prisma,
  query,
  runtimeContext = {},
  limit = 5,
} = {}) {


  const memoryResult =
    await createMemoryContextProvider({

      prisma,

      query,

      limit,

    })



  if (
    !memoryResult.success
  ) {

    return {

      success:
        false,

      status:
        memoryResult.status,

      runtimeContext,

    }

  }



  const mergedRuntimeContext =
    injectMemoryRuntimeContext({

      runtimeContext,

      memoryRuntimeContext:
        memoryResult.runtimeContext,

    })



  return {

    success:
      true,


    status:
      "completed",


    runtimeContext:
      mergedRuntimeContext,


    memories:
      memoryResult.memories,

  }

}



export {
  createMemoryBrainBridge,
}
