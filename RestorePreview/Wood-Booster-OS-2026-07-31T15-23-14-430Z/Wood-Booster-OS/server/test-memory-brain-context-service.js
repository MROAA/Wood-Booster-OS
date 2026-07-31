/*
=====================================
MEMORY BRAIN CONTEXT SERVICE TEST
=====================================
*/


import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  buildMemoryBrainContext,
} from "./services/aiBrainV2/services/memoryBrainContextService.js"



const prisma =
  new PrismaClient()



async function run(){


  const result =
    await buildMemoryBrainContext({

      prisma,

      query:
        "spacemonkey",

    })



  console.log(
    result,
  )



  await prisma.$disconnect()

}



run()
