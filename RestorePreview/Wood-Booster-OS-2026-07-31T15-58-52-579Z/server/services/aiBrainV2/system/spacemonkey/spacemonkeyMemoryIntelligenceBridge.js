function createMemoryIntelligence({

  memories = [],

} = {}){


  const total =

    Array.isArray(memories)

      ?

      memories.length

      :

      0





  const latest =

    total > 0

      ?

      memories[0]

      :

      null







  return {


    total,



    latest,



    status:

      total > 0

        ?

        "active"

        :

        "empty",



    summary:

      total > 0

        ?

        `Spacemonkey käyttää ${total} muistia.`

        :

        "Spacemonkeyllä ei ole vielä aktiivisia muistoja.",



    learning:

    {

      enabled:

        true,


      automatic:

        false,


      reason:

        "Muisti toimii turvallisena tietokerroksena."

    }

  }

}







async function getMemoryIntelligence({

  prisma,

} = {}){


  let memories = []





  if(prisma){


    try{


      const result =

        await prisma.memory.findMany({

          orderBy: {

            createdAt:

              "desc"

          },

          take:

            10

        })



      memories = result


    }


    catch(error){


      memories = []


    }


  }







  return createMemoryIntelligence({

    memories

  })

}







export {

  createMemoryIntelligence,

  getMemoryIntelligence

}
