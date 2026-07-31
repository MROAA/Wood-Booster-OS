/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY INJECTION ADAPTER V2.2

Vastuut:
- muuntaa runtime memory context
- välittää muistot AI Brainille
- tukee memoryItems ja memoryContext formaatteja

=====================================
*/


function normalizeArray(value) {

  return Array.isArray(value)
    ? value
    : []

}



function createMemoryInjectionContext({

  runtimeContext = {},

} = {}) {



  const runtimeMemoryItems =
    normalizeArray(
      runtimeContext.memoryItems,
    )



  const memory =

    runtimeMemoryItems.map(
      item => ({

        category:
          item.category ||
          "runtime",


        key:
          item.key ||
          "memory",


        content:
          item.content ||
          "",


        importance:
          item.importance ||
          5,

      })

    )



  /*
    Jos Memory Bridge
    antaa valmiin tekstimuodon,
    välitetään se edelleen.
  */


  const memoryContext =
    String(
      runtimeContext.memoryContext ||
      "",
    )



  if (
    memory.length === 0 &&
    memoryContext
  ) {

    return {

      memory: [

        {

          category:
            "memory_context",


          key:
            "retrieved_memory",


          content:
            memoryContext,


          importance:
            5,

        },

      ],


      memoryContext,

    }

  }



  return {

    memory,

    memoryContext,

  }

}



export {

  createMemoryInjectionContext,

}
