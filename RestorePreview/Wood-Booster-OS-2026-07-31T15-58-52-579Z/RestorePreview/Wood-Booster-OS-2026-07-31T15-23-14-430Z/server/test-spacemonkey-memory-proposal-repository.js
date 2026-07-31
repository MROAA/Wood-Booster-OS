/*
=====================================
WOOD-BOOSTER AI BRAIN V2

SPACEMONKEY MEMORY PROPOSAL REPOSITORY TEST

=====================================
*/


import {
  createSpacemonkeyBirthMemoryProposal,
} from "./services/aiBrainV2/services/spacemonkeyBirthMemoryService.js"


import {
  normalizeSpacemonkeyMemory,
} from "./services/aiBrainV2/services/spacemonkeyMemoryProposalAdapter.js"


import {
  createMemoryProposalRecord,
} from "./services/aiBrainV2/services/spacemonkeyMemoryProposalRepository.js"



async function run(){

  const memory =
    createSpacemonkeyBirthMemoryProposal()


  const proposal =
    normalizeSpacemonkeyMemory({
      memory,
    })


  const result =
    await createMemoryProposalRecord({
      proposal:
        proposal.proposal,
    })


  console.log(
    result,
  )

}


run()
