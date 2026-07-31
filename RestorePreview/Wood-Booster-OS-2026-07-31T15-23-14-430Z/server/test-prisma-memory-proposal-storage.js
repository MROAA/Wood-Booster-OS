/*
=====================================
PRISMA MEMORY PROPOSAL STORAGE TEST
=====================================
*/


import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  createSpacemonkeyBirthMemoryProposal,
} from "./services/aiBrainV2/services/spacemonkeyBirthMemoryService.js"


import {
  normalizeSpacemonkeyMemory,
} from "./services/aiBrainV2/services/spacemonkeyMemoryProposalAdapter.js"


import {
  storeMemoryProposal,
} from "./services/aiBrainV2/services/prismaMemoryProposalStorage.js"



const prisma =
  new PrismaClient()



async function run(){

  const memory =
    createSpacemonkeyBirthMemoryProposal()


  const proposal =
    normalizeSpacemonkeyMemory({
      memory,
    })


  const result =
    await storeMemoryProposal({

      prisma,

      proposal:
        proposal.proposal,

    })


  console.log(result)


  await prisma.$disconnect()

}



run()
