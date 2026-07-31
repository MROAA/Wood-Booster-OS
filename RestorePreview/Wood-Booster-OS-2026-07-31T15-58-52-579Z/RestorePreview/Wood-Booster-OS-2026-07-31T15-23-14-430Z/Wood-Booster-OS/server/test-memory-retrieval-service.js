/*
=====================================
MEMORY RETRIEVAL SERVICE TEST
=====================================
*/


import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  retrieveMemories,
  createMemoryContext,
} from "./services/aiBrainV2/services/memoryRetrievalService.js"



const prisma =
  new PrismaClient()



async function run(){


  const result =
    await retrieveMemories({

      prisma,

      query:
        "spacemonkey",

    })


  console.log(
    result,
  )


  console.log(
    "CONTEXT:",
  )


  console.log(
    createMemoryContext(
      result.memories,
    ),
  )



  await prisma.$disconnect()

}



run()
