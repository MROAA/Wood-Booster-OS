import prisma from "./prisma.js"

import {
  getSpacemonkeyCoreStatus,
} from "./services/aiBrainV2/system/spacemonkey/spacemonkeyCoreStatusService.js"


import {
  createSpacemonkeyContextText,
} from "./services/spacemonkey/contextAdapter.js"





const spacemonkey =
  await getSpacemonkeyCoreStatus({

    prisma

  })





const context =
  createSpacemonkeyContextText({

    spacemonkey

  })





console.log(context)





await prisma.$disconnect()
