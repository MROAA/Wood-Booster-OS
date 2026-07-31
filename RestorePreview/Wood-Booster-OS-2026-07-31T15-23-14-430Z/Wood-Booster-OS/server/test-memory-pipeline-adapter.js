import prisma from "./prisma.js"

import {
  processMemoryPipeline,
} from "./services/memoryPipelineAdapter.js"


async function runTest() {
  console.log(
    "TESTI: Memory Pipeline Adapter",
  )

  const result =
    await processMemoryPipeline({
      message:
        "Haluan edetä Wood-Booster AI OS -projektissa aina yksi vaihe kerrallaan.",

      answer:
        "EteneCROCODILEDUNDEEmme yksi vaihe kerrallaan ja tarkistamme jokaisen muutoksen ennen seuraavaa vaihetta.",

      prismaClient:
        prisma,

      model:
        "qwen2.5:7b",
    })

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  )
}


runTest()
  .catch(
    (error) => {
      console.error(
        "TESTI EPÄONNISTUI:",
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
