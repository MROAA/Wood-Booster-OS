/*
=====================================
MEMORY CONTEXT ADAPTER TEST
=====================================
*/


import {
  retrieveMemories,
} from "./services/aiBrainV2/services/memoryRetrievalService.js"


import {
  createMemoryContext,
} from "./services/aiBrainV2/services/memoryContextAdapter.js"


import {
  PrismaClient,
} from "./generated/prisma/index.js"



const prisma =
  new PrismaClient()



async function run(){


  const retrieval =
    await retrieveMemories({

      prisma,

      query:
        "spacemonkey",

    })



  const context =
    createMemoryContext({

      memories:
        retrieval.memories,

    })



  console.log(
    context,
  )



  await prisma.$disconnect()

}



run()
