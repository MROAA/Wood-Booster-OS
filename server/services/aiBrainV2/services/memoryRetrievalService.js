/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY RETRIEVAL SERVICE V2

Vastuut:

- hakee pysyviä muistoja
- käyttää hakua
- fallback käyttäjämuistoille

=====================================
*/


function normalizeSearchText(
  value = "",
){

  return String(value)
    .toLowerCase()
    .trim()

}



async function retrieveMemories({
  prisma,
  query,
  limit = 5,
} = {}) {


  if (!prisma) {

    return {

      success:false,

      status:"database_missing",

      memories:[],

    }

  }



  try {


    const search =
      normalizeSearchText(
        query,
      )



    let memories =
      []



    if (search) {

      memories =
        await prisma.memory.findMany({

          where: {

            OR: [

              {
                key:{
                  contains:
                    search,
                },
              },

              {
                content:{
                  contains:
                    search,
                },
              },

            ],

          },


          orderBy:[

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

    }



    /*
      Fallback:

      Jos käyttäjä kysyy yleisesti
      omista tiedoistaan,
      annetaan tärkeimmät muistot.
    */

    if (
      memories.length === 0
    ) {


      memories =
        await prisma.memory.findMany({

          where:{

            category:{
              in:[
                "user_preference",
                "user",
                "profile",
              ],
            },

          },


          orderBy:[

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


    }



    return {

      success:true,

      status:"completed",

      memories,

    }


  }


  catch(error){


    return {

      success:false,

      status:"retrieval_failed",

      memories:[],

      error:
        error.message,

    }

  }

}



function createMemoryContext(
  memories = [],
){

  if (
    !Array.isArray(memories) ||
    memories.length === 0
  ){

    return ""

  }



  return memories

    .map(
      memory =>

`
MEMORY:

Category:
${memory.category}

Key:
${memory.key}

Content:
${memory.content}
`

    )

    .join("\n\n")

}



export {
  retrieveMemories,
  createMemoryContext,
}
