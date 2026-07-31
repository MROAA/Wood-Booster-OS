/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CONTEXT DEBUG REPORTER V1


Vastuut:

- näyttää mitä context engine valitsi
- helpottaa debuggausta
- ei vaikuta AI Brain toimintaan


Ei:

- ei muuta dataa
- ei tee päätöksiä
- ei kutsu LLM:ää


=====================================
*/





function createContextDebugReport({

  message = "",

  orchestration = {},

  fusion = {},

} = {}){



  return {


    source:

      "context-debug-reporter",



    message,



    detected:

      orchestration
        ?.plan
        ?.requirements ||
      {},



    resolvers:

      orchestration
        ?.plan
        ?.resolvers ||
      [],



    fusion:

      {


        knowledgeSources:

          Array.isArray(
            fusion.knowledge
          )

          ?

          fusion.knowledge.map(

            item =>
              item.id

          )

          :

          [],



        memoryCount:

          Array.isArray(
            fusion.memories
          )

          ?

          fusion.memories.length

          :

          0,



        projectCount:

          Array.isArray(
            fusion.projects
          )

          ?

          fusion.projects.length

          :

          0


      },



    createdAt:

      new Date()
        .toISOString()


  }


}







export {

  createContextDebugReport

}
