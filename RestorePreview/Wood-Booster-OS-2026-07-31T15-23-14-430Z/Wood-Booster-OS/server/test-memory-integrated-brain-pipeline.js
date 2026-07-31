/*
=====================================
MEMORY INTEGRATED BRAIN PIPELINE TEST

Testaa:

Memory Brain Bridge
        +
Memory Context Integration
        +
Brain Pipeline

EI MUUTA TUOTANTOKOODIA

=====================================
*/


import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  createMemoryBrainBridge,
} from "./services/aiBrainV2/services/memoryBrainBridge.js"


import {
  integrateMemoryContext,
} from "./services/aiBrainV2/services/memoryContextIntegrationAdapter.js"


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
          "integrated-memory-test",

      },

    })



  console.log(
    "MEMORY BRIDGE:",
    memoryBridge,
  )



  const integratedContext =
    integrateMemoryContext({

      runtimeContext:
        memoryBridge.runtimeContext,

    })



  console.log(
    "INTEGRATED CONTEXT:",
    integratedContext,
  )



  const brainResult =
    await runBrainPipeline({

      message,

      source:
        "integrated-memory-test",

      runtimeContext:
        integratedContext,

    })



  console.log(
    "BRAIN RESULT:",
    brainResult,
  )



  await prisma.$disconnect()

}



run()
