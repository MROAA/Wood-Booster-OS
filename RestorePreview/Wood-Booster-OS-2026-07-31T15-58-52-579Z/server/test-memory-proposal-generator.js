import prisma from "./prisma.js"

import {
  generateMemoryProposal,
} from "./services/memoryProposalGenerator.js"


async function runTest() {
  console.log(
    "TESTI: Memory Proposal Generator",
  )

  const result =
    await generateMemoryProposal({
      prismaClient:
        prisma,

      conversation: [
        {
          role:
            "user",

          content:
            "Haluan edetä koodauksessa aina yksi vaihe kerrallaan.",
        },
      ],

      message:
        "Haluan myös aina kokonaiset korvaavat tiedostot, en yksittäisiä rivimuutoksia.",

      answer:
        "Selvä. Etenemme vaiheittain ja käytämme kokonaisia tiedostoja.",
    })

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  )

  await prisma.$disconnect()
}


runTest()
  .catch(
    async (error) => {
      console.error(
        "TESTI EPÄONNISTUI:",
        error,
      )

      await prisma.$disconnect()

      process.exitCode =
        1
    },
  )
