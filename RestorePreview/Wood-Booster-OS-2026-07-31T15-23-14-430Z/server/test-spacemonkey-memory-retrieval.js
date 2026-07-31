import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  retrieveSpacemonkeyMemories,
  formatMemoryContext,
} from "./server/services/aiBrainV2/personality/spacemonkeyMemoryRetrieval.js"



const prisma =
  new PrismaClient()



async function test(){


  const result =
    await retrieveSpacemonkeyMemories({

      prisma,

      query:
        "Wood-Booster AI Brain muistijärjestelmä"

    })



  console.log(
    "\nMEMORY SEARCH RESULT\n"
  )


  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  )



  console.log(
    "\nFORMATTED CONTEXT\n"
  )


  console.log(

    formatMemoryContext({

      memories:
        result.memories

    })

  )


}



test()

  .catch(error => {

    console.error(error)

  })

  .finally(async()=>{

    await prisma.$disconnect()

  })
