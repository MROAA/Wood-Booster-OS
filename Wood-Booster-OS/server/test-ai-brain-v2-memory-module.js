/*
=====================================
AI BRAIN V2

MEMORY MODULE TEST

Tämä testi varmistaa:
- Memory Module tunnistaa muistipyynnön
- Prisma-yhteys välittyy runtimeContextissa
- hyväksytyt muistot voidaan listata
- odottavat muistiehdotukset voidaan listata
=====================================
*/


import prisma from "./prisma.js"

import {
  clearBrainModules,
  registerBrainModule,
  runBrain,
} from "./services/aiBrainV2/index.js"

import {
  createMemoryModule,
} from "./services/aiBrainV2/modules/memoryModule.js"


async function runTest() {
  clearBrainModules()

  registerBrainModule(
    createMemoryModule(),
  )

  const runtimeContext = {
    prisma,
  }

  const memoryResult =
    await runBrain({
      message:
        "Näytä muistot",

      source:
        "memory-module-test",

      runtimeContext,
    })

  console.log(
    "\nMEMORY LIST RESULT\n",
  )

  console.dir(
    memoryResult,
    {
      depth:
        null,
    },
  )

  const memoryTestPassed =
    memoryResult.success ===
      true &&
    memoryResult.status ===
      "completed" &&
    memoryResult.module?.id ===
      "memory" &&
    memoryResult.output?.type ===
      "memory_result" &&
    memoryResult.output?.mode ===
      "list_memories" &&
    Array.isArray(
      memoryResult.output?.memories,
    )

  if (!memoryTestPassed) {
    throw new Error(
      "Hyväksyttyjen muistojen listaus epäonnistui.",
    )
  }

  const proposalResult =
    await runBrain({
      message:
        "Näytä muistiehdotukset",

      source:
        "memory-module-test",

      runtimeContext,
    })

  console.log(
    "\nMEMORY PROPOSAL RESULT\n",
  )

  console.dir(
    proposalResult,
    {
      depth:
        null,
    },
  )

  const proposalTestPassed =
    proposalResult.success ===
      true &&
    proposalResult.status ===
      "completed" &&
    proposalResult.module?.id ===
      "memory" &&
    proposalResult.output?.type ===
      "memory_result" &&
    proposalResult.output?.mode ===
      "list_proposals" &&
    Array.isArray(
      proposalResult.output?.proposals,
    )

  if (!proposalTestPassed) {
    throw new Error(
      "Muistiehdotusten listaus epäonnistui.",
    )
  }

  console.log(
    "\n✅ AI Brain v2 Memory Module -testi onnistui.\n",
  )
}


runTest()
  .catch(
    (error) => {
      console.error(
        "\n❌ AI Brain v2 Memory Module -testi epäonnistui:",
        error,
      )

      process.exitCode =
        1
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect()
    },
  )
