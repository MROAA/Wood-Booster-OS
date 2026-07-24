import prisma from "../prisma.js"




/*
==================================================

WOOD-BOOSTER MEMORY PROPOSAL SERVICE

Proposal = AI:n ehdotus

Memory = hyväksytty pysyvä tieto

==================================================
*/







export async function createMemoryProposal({

  prismaClient,

  memory,

} = {}) {



  const database =

    prismaClient ||

    prisma



  if (!database || !memory) {


    return null

  }





  try {


    const proposal =

      await database.memoryProposal.create({

        data: {


          category:

            memory.category ||
            "general",



          key:

            memory.key,



          content:

            memory.content,



          importance:

            memory.importance || 5,


        }

      })





    return proposal



  }

  catch(error) {


    console.error(

      "CREATE MEMORY PROPOSAL ERROR:",

      error.message

    )


    return null


  }


}









export async function getPendingProposals({

  prismaClient,

} = {}) {


  const database =

    prismaClient ||

    prisma



  try {


    return await database.memoryProposal.findMany({

      where: {

        status:
          "pending",

      },


      orderBy: {

        createdAt:
          "desc",

      },


    })



  }


  catch(error) {


    console.error(

      "GET MEMORY PROPOSALS ERROR:",

      error.message

    )


    return []


  }


}









export async function approveMemoryProposal(

  id,

  {
    prismaClient,

  } = {}

) {


  const database =

    prismaClient ||

    prisma



  try {


    const proposal =

      await database.memoryProposal.findUnique({

        where: {

          id,

        },

      })





    if (!proposal) {


      return null

    }





    const memory =

      await database.memory.create({

        data: {


          category:

            proposal.category,


          key:

            proposal.key,


          content:

            proposal.content,


          importance:

            proposal.importance,


        },

      })






    await database.memoryProposal.update({

      where: {

        id,

      },


      data: {

        status:
          "approved",

      },


    })






    return memory



  }


  catch(error) {


    console.error(

      "APPROVE MEMORY ERROR:",

      error.message

    )


    return null


  }


}









export async function rejectMemoryProposal(

  id,

  {
    prismaClient,

  } = {}

) {


  const database =

    prismaClient ||

    prisma



  try {


    return await database.memoryProposal.update({

      where: {

        id,

      },


      data: {

        status:
          "rejected",

      },


    })


  }


  catch(error) {


    console.error(

      "REJECT MEMORY ERROR:",

      error.message

    )


    return null


  }


}