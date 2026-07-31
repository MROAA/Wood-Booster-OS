/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY BRAIN CONTEXT SERVICE V1

Vastuut:

- yhdistää muistien haun ja kontekstin luonnin
- tarjoaa yhden rajapinnan AI Brainille
- muodostaa käyttövalmiin muistikontextin

Tämä EI:

- kirjoita tietokantaan
- hyväksy muistoja
- muuta AI Brain ydintä

=====================================
*/


import {
  retrieveMemories,
} from "./memoryRetrievalService.js"


import {
  createMemoryContext,
} from "./memoryContextAdapter.js"



async function buildMemoryBrainContext({
  prisma,
  query,
  limit = 5,
} = {}) {


  const retrieval =
    await retrieveMemories({

      prisma,

      query,

      limit,

    })



  if (
    !retrieval.success
  ) {

    return {

      success:
        false,

      status:
        retrieval.status,

      context:
        "",

      memories:
        [],

    }

  }



  const context =
    createMemoryContext({

      memories:
        retrieval.memories,

    })



  return {

    success:
      true,


    status:
      "completed",


    context:
      context.context,


    memoryCount:
      retrieval.memories.length,


    memories:
      retrieval.memories,

  }

}



export {
  buildMemoryBrainContext,
}
