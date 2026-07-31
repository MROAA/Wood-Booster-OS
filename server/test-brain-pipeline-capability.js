import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  runBrainPipeline,
} from "./services/aiBrainV2/brainPipeline.js"



const prisma =
  new PrismaClient()



const result =
  await runBrainPipeline({

    message:
      "Haluan muistaa uuden tuotteen suunnittelun",


    runtimeContext:{
      prisma,
    },

  })



console.dir(
  result,
  {
    depth:
      null,

    colors:
      true,
  },
)



await prisma.$disconnect()
