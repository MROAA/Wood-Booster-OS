/*
=====================================
SPACEMONKEY MEMORY PROPOSAL ADAPTER TEST
=====================================
*/


import {
  createSpacemonkeyBirthMemoryProposal,
} from "./services/aiBrainV2/services/spacemonkeyBirthMemoryService.js"


import {
  normalizeSpacemonkeyMemory,
} from "./services/aiBrainV2/services/spacemonkeyMemoryProposalAdapter.js"



const memory =
  createSpacemonkeyBirthMemoryProposal()



const result =
  normalizeSpacemonkeyMemory({
    memory,
  })


console.log(result)
