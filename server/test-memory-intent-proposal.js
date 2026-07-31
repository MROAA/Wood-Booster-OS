import {
  createMemoryProposalFromIntent,
} from "./services/memoryIntentProposalService.js"

import prisma from "./prisma.js"


const result =
  await createMemoryProposalFromIntent({
    prismaClient:
      prisma,

    content:
      "Spacemonkey syntyi 24.07.2026.",
  })


console.log(
  result,
)
