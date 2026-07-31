import prisma from "./prisma.js"

import {
  getSpacemonkeyCoreStatus,
} from "./services/aiBrainV2/system/spacemonkey/spacemonkeyCoreStatusService.js"


import {
  createSpacemonkeySystemPrompt,
} from "./services/spacemonkey/systemPrompt.js"



const spacemonkey =
  await getSpacemonkeyCoreStatus({
    prisma
  })



console.log(
  createSpacemonkeySystemPrompt({
    spacemonkey
  })
)



await prisma.$disconnect()
