import {
  PrismaClient,
} from "./generated/prisma/client.js"


import {
  runBrainPipeline,
} from "./services/aiBrainV2/brainPipeline.js"



const prisma =
  new PrismaClient()



const tests = [

  "Analysoi Wood-Booster OS:n seuraava kehitysvaihe",

  "Haluan muistaa että Wood-Booster käyttää suomen kieltä",

  "Kerro mikä Spacemonkey on",

  "Avaa projektit",

]



try {


for (
  const message
  of tests
) {


  console.log("\n====================")

  console.log(
    "TEST:",
    message,
  )



  const result =

    await runBrainPipeline({

      message,


      runtimeContext: {

        prisma,

      },

    })



  console.log(
    "SUCCESS:",
    result.success,
  )


  console.log(
    "STATUS:",
    result.status,
  )


  console.log(
    "DECISION:",
    result.stages
      ?.decision
      ?.output
      ?.targetModule,
  )


  console.log(
    "OVERRIDE:",
    result.stages
      ?.decision
      ?.output
      ?.overrideApplied,
  )


  console.log(
    "EXECUTION:",
    result.stages
      ?.execution
      ?.module
      ?.id,
  )



  if (
    result.error
  ) {

    console.log(
      "\nPIPELINE ERROR",
    )


    console.dir(
      result.error,
      {
        depth:null,
        colors:true,
      },
    )

  }



  if (
    result.stages
      ?.execution
      ?.error
  ) {

    console.log(
      "\nEXECUTION ERROR",
    )


    console.dir(
      result.stages
        .execution
        .error,
      {
        depth:null,
        colors:true,
      },
    )

  }



  console.log(
    "\nFULL FINAL OUTPUT",
  )


  console.dir(
    result.finalOutput,
    {
      depth:null,
      colors:true,
    },
  )


}


}
finally {


  await prisma.$disconnect()


}
