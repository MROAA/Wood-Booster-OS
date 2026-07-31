/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY APPROVAL SERVICE TEST

=====================================
*/


import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  approveMemoryProposal,
} from "./services/aiBrainV2/services/memoryApprovalService.js"



const prisma =
  new PrismaClient()



async function run(){


  const proposal =
    await prisma.memoryProposal.findFirst({

      where:{
        key:
          "spacemonkey_birth",
      },

      orderBy:{
        id:
          "desc",
      },

    })



  console.log(
    "FOUND PROPOSAL:",
    proposal,
  )



  if (!proposal) {

    console.log(
      "No proposal found",
    )

    await prisma.$disconnect()

    return

  }



  const result =
    await approveMemoryProposal({

      prisma,

      proposalId:
        proposal.id,

    })



  console.log(
    "APPROVAL RESULT:",
    result,
  )



  await prisma.$disconnect()

}



run()
