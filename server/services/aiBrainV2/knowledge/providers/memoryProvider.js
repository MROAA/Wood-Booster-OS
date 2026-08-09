/*
=====================================

WOOD-BOOSTER AI BRAIN V2

MEMORY KNOWLEDGE PROVIDER V3


Vastuut:

- tarjoaa muistikerroksen Knowledge Layerille
- hakee muistot
- suodattaa relevantit muistot kysymyksen perusteella
- muodostaa runtime-yhteensopivan tiedon


Ei:

- ei kirjoita muistia
- ei hyväksy muistoja
- ei muuta muistia


=====================================
*/


import {
  getPersistentMemoryStatus,
  findMemory,
} from "../../system/spacemonkey/spacemonkeyPersistentMemory.js"



import {
  retrieveRelevantMemories,
} from "../../memory/memoryRetrievalEngine.js"







async function loadMemoryKnowledge({

  prisma = null,

  message = "",

} = {}){


  let memories = []



  try {


    const allMemories =

      await findMemory({

        prisma,

      })



    memories =

      retrieveRelevantMemories({

        message,

        memories:
          allMemories,

        limit:
          5,

      })


  }

  catch(error){


    memories = []

  }







  return {


    id:

      "MEMORY_CONTEXT",



    source:

      "memory",



    category:

      "memory",



    content:

      JSON.stringify(

        {

          description:

            "Spacemonkey relevant memory layer.",



          query:

            message,



          status:

            await getPersistentMemoryStatus({

              prisma,

            }),



          memories,

        },

        null,

        2

      ),



    priority:

      80,



    metadata:{

      count:

        memories.length

    }


  }


}







export {

  loadMemoryKnowledge

}
