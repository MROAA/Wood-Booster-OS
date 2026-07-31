/*
=====================================
MEMORY BRAIN PIPELINE CONTEXT TEST

Testaa:

Memory Brain Bridge
        +
AI Brain Pipeline runtimeContext

Tämä EI muuta tuotantoa.

=====================================
*/


import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  createMemoryBrainBridge,
} from "./services/aiBrainV2/services/memoryBrainBridge.js"


import {
  runBrainPipeline,
} from "./services/aiBrainV2/brainPipeline.js"



const prisma =
  new PrismaClient()



async function run(){


  const message =
    "Milloin Spacemonkey syntyi?"



  console.log(
    "USER MESSAGE:",
    message,
  )



  const memoryBridge =
    await createMemoryBrainBridge({

      prisma,

      query:
        "spacemonkey",

      runtimeContext: {

        source:
          "memory-pipeline-test",

      },

    })



  console.log(
    "MEMORY BRIDGE:",
    memoryBridge,
  )



  const brainResult =
    await runBrainPipeline({

      message,

      runtimeContext:
        memoryBridge.runtimeContext,

      source:
        "memory-pipeline-test",

    })



  console.log(
    "BRAIN RESULT:",
    brainResult,
  )



  await prisma.$disconnect()

}



run()
