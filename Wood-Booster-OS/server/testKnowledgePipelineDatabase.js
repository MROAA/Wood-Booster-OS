/*
=====================================
WOOD-BOOSTER AI BRAIN V2
KNOWLEDGE PIPELINE DATABASE TEST

Vastuut:
- käyttää oikeaa Prisma-tietokantaa
- ajaa Knowledge Pipeline -testin
- tallentaa pending-ehdotuksen
- tulostaa testituloksen
- sulkee Prisma-yhteyden turvallisesti
=====================================
*/


import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  runKnowledgePipeline,
} from "./services/aiBrainV2/knowledge/knowledgePipeline.js"


const prisma =
  new PrismaClient()


async function runTest() {
  const message =
    "Muista että Knowledge Pipeline tallentaa vain hyväksyntää odottavia ehdotuksia."

  const result =
    await runKnowledgePipeline({
      prisma,
      message,
      source:
        "chat",
    })

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  )
}


async function main() {
  try {
    await runTest()
  } catch (error) {
    console.error(
      "KNOWLEDGE PIPELINE DATABASE TEST FAILED",
    )

    console.error(
      error,
    )

    process.exitCode =
      1
  } finally {
    await prisma.$disconnect()
  }
}


main()
