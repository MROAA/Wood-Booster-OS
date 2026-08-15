/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY CONTEXT PROVIDER V2

Vastuut:

- yhdistää koko muistokerroksen
- tarjoaa yhden rajapinnan AI Brainille
- välittää muistilistat runtimeen

Tämä EI:

- kirjoita muistia
- hyväksy muistoja
- muuta AI Brain ydintä

=====================================
*/


import {
  buildMemoryBrainContext,
} from "./memoryBrainContextService.js"


import {
  createMemoryRuntimeContext,
} from "./memoryRuntimeAdapter.js"



async function createMemoryContextProvider({
  prisma,
  query,
  limit = 5,
} = {}) {


  const brainContext =
    await buildMemoryBrainContext({

      prisma,

      query,

      limit,

    })



  if (
    !brainContext.success
  ) {

    return {

      success:
        false,

      status:
        brainContext.status,

      runtimeContext:
        null,

    }

  }



  const runtimeContext =
    createMemoryRuntimeContext({

      memoryContext:
        brainContext,


      memories:
        brainContext.memories,

    })



  return {

    success:
      true,


    status:
      "completed",


    runtimeContext,


    memories:
      brainContext.memories,

  }

}



export {
  createMemoryContextProvider,
}
