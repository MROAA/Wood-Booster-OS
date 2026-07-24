/*
==================================================

WOOD-BOOSTER AI MEMORY SERVICE

Pitkäaikainen muisti.

Conversation = keskusteluhistoria

Memory = tärkeät opit ja päätökset

==================================================
*/


export async function getMemory({

  prisma,

  category,

  limit = 10,

} = {}) {


  if (!prisma) {

    return []

  }



  try {


    const memories =

      await prisma.memory.findMany({

        where:

          category

            ? {
                category,
              }

            :

              undefined,


        orderBy: [

          {
            importance:
              "desc",
          },


          {
            updatedAt:
              "desc",
          },

        ],


        take:
          limit,

      })



    return memories



  }


  catch(error) {


    console.error(

      "MEMORY READ ERROR:",

      error.message

    )


    return []

  }


}








export async function saveMemory({

  prisma,

  category = "general",

  key,

  content,

  importance = 5,

} = {}) {


  if (!prisma) {

    return null

  }



  try {


    return await prisma.memory.create({

      data: {

        category,

        key,

        content,

        importance,

      },

    })


  }


  catch(error) {


    console.error(

      "MEMORY SAVE ERROR:",

      error.message

    )


    return null

  }

}