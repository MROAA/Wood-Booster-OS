/*
=====================================
MEMORY CONTEXT PROVIDER TEST
=====================================
*/


import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  createMemoryContextProvider,
} from "./services/aiBrainV2/services/memoryContextProvider.js"



const prisma =
  new PrismaClient()



async function run(){


  const result =
    await createMemoryContextProvider({

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
