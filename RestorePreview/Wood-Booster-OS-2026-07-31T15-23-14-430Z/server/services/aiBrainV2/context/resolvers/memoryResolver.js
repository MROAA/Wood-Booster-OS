/*
=====================================

WOOD-BOOSTER AI BRAIN V2

MEMORY CONTEXT RESOLVER V1


Vastuut:

- hakee muistikerroksen tiedot
- rajaa memory-contextin
- yhdistää Memory Retrieval Engineen


Ei:

- ei tallenna muistia
- ei hyväksy muistoja
- ei muuta muistia


=====================================
*/


import {
  retrieveRelevantMemories,
} from "../../memory/memoryRetrievalEngine.js"







function resolveMemoryContext({

  message = "",

  memories = [],

} = {}){



  const relevantMemories =

    retrieveRelevantMemories({

      message,

      memories,

      limit:
        5

    })







  return {


    resolver:

      "memory-resolver",



    enabled:

      true,



    count:

      relevantMemories.length,



    memories:

      relevantMemories


  }


}







export {

  resolveMemoryContext

}
