/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CONVERSATION CONTEXT ADAPTER V1


Vastuut:

- muuttaa Context Fusion keskustelumoduulin muotoon
- lisää uuden kontekstikerroksen knowledgeen


Ei:

- ei kutsu AI Brainia
- ei muuta runtimea
- ei tallenna tietoa


=====================================
*/



function normalizeArray(value){

  return Array.isArray(value)

    ? value

    : []

}







function createFusionKnowledge({

  fusionContext = {},

} = {}){


  const knowledge =

    normalizeArray(
      fusionContext.knowledge
    )



  return knowledge.map(

    item => ({

      name:

        item.id || "CONTEXT_KNOWLEDGE",


      content:

        item.content || ""

    })

  )

}







function createFusionMemory({

  fusionContext = {},

} = {}){


  return normalizeArray(

    fusionContext.memories

  )

}







function createFusionProjects({

  fusionContext = {},

} = {}){


  return normalizeArray(

    fusionContext.projects

  )

}







function createConversationContextKnowledge({

  fusionContext = {},

} = {}){


  return {


    knowledge:

      createFusionKnowledge({

        fusionContext

      }),



    memory:

      createFusionMemory({

        fusionContext

      }),



    projects:

      createFusionProjects({

        fusionContext

      }),



    metadata:{

      resolvers:

        fusionContext.resolvers || [],


      source:

        "conversation-context-adapter"

    }


  }


}







export {

  createConversationContextKnowledge

}
