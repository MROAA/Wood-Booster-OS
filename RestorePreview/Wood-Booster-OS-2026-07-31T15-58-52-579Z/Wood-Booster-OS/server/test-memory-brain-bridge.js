/*
=====================================
MEMORY BRAIN BRIDGE TEST
=====================================
*/


import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  createMemoryBrainBridge,
} from "./services/aiBrainV2/services/memoryBrainBridge.js"



const prisma =
  new PrismaClient()



async function run(){


  const result =
    await createMemoryBrainBridge({

      prisma,

      query:
        "spacemonkey",

      runtimeContext: {

        requestId:
          "bridge-test-001",

        source:
          "test",

      },

    })



  console.log(
    result,
  )



  await prisma.$disconnect()

}



run()
