/*
=====================================
WOOD-BOOSTER AI BRAIN V2

RUNTIME CONTEXT BUILDER V2

Vastuut:

- yhdistää AI Brain runtime tiedot
- lisää suomalaisen identiteetin
- lisää muistikerroksen kontekstin
- lisää Spacemonkey Core kontekstin
- valmistaa kontekstin pipelinelle

Tämä ei:

- kutsu mallia
- tallenna muistia
- muuta moduuleja

=====================================
*/


import {
  createFinnishRuntimeContext,
} from "../engines/finnishRuntimeContext.js"



import {
  getSpacemonkeyCoreStatus,
} from "../system/spacemonkey/spacemonkeyCoreStatusService.js"







async function buildRuntimeContext({

  memoryContext = null,

  memoryItems = [],

  memoryCount = 0,

  memoryEnabled = false,

  prisma = null,

} = {}) {



  const finnishContext =
    await createFinnishRuntimeContext()





  let spacemonkey = null





  if(prisma){


    spacemonkey =
      await getSpacemonkeyCoreStatus({

        prisma

      })


  }







  return {


    language:

      finnishContext.language || null,



    culture:

      finnishContext.culture || null,



    identity:

      finnishContext.identity || "",



    rules:

      finnishContext.rules || [],



    sources:

      finnishContext.sourceDocuments || [],





    spacemonkey,





    memoryEnabled,



    memoryContext:

      memoryContext || "",



    memoryCount,



    memoryItems:

      Array.isArray(memoryItems)

        ? memoryItems

        : [],


  }


}







export {

  buildRuntimeContext,

}
