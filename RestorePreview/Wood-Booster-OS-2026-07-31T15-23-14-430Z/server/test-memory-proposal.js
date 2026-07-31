import {
  createMemoryProposal,
  getPendingProposals,
  approveMemoryProposal
} from "./services/memoryProposalService.js"



const proposal =
  await createMemoryProposal({

    category:
      "brand",

    key:
      "quality_over_speed",

    content:
      "Wood-Booster prioritizes quality over speed.",

    importance:
      10

  })



console.log(
  "CREATED:"
)

console.log(
  proposal
)



const pending =
  await getPendingProposals()



console.log(
  "PENDING:"
)

console.log(
  pending
)