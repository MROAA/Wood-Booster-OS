/*
=====================================

SPACEMONKEY LEARNING INTEGRATION V3


Yhdistää:

- Cognitive Event Bridge
- Memory Bridge
- Knowledge Integration
- Learning Pipeline
- Learning Event Bridge


Vastuut:

- hallitsee oppimiskerroksen tilaa
- välittää tapahtumia Learning Pipelineen
- tarjoaa järjestelmän oppimistilan


Ei:

- ei kirjoita tietokantaan
- ei hyväksy muistia automaattisesti
- ei kutsu LLM:ää
- ei tee päätöksiä


=====================================
*/


import {
  getSpacemonkeyCognitiveEventBridgeStatus,
} from "./spacemonkeyCognitiveEventBridge.js"



import {
  getMemoryIntegrationStatus,
} from "./spacemonkeyMemoryIntegration.js"



import {
  getSpacemonkeyKnowledgeAdapterStatus,
} from "./spacemonkeyKnowledgeIntegrationAdapter.js"



import {
  processLearningEvent,
  getLearningPipelineStatus,
} from "./spacemonkeyLearningPipeline.js"



import {
  getSpacemonkeyLearningEventBridgeStatus,
} from "./spacemonkeyLearningEventBridge.js"







let learningEnabled = false







function startSpacemonkeyLearningIntegration(){


  learningEnabled = true



  return {

    success:
      true,


    status:
      "started",


    pipeline:
      getLearningPipelineStatus(),


    eventBridge:
      getSpacemonkeyLearningEventBridgeStatus(),

  }

}







function processSpacemonkeyLearningEvent({

  name,

  payload = {},

  source = "unknown",

} = {}){


  if(!learningEnabled){

    return {

      success:
        false,


      status:
        "learning_disabled",

    }

  }



  return processLearningEvent({

    name,

    payload,

    source,

  })


}







function getSpacemonkeyLearningIntegrationStatus(){


  const eventBridge =
    getSpacemonkeyLearningEventBridgeStatus()



  return {


    system:
      "Spacemonkey Learning Integration",



    version:
      "3.0.0",



    status:

      learningEnabled
        ? "ACTIVE"
        : "READY",



    learning:

      {

        enabled:
          learningEnabled,


        eventsProcessed:

          eventBridge.eventsProcessed || 0,


        lastEvent:

          eventBridge.lastEvent || null,


      },



    pipeline:

      getLearningPipelineStatus(),



    eventBridge,



    components:

      {


        cognitiveEvents:

          getSpacemonkeyCognitiveEventBridgeStatus(),



        memory:

          getMemoryIntegrationStatus(),



        knowledge:

          getSpacemonkeyKnowledgeAdapterStatus(),


      }


  }

}







export {

  startSpacemonkeyLearningIntegration,

  processSpacemonkeyLearningEvent,

  getSpacemonkeyLearningIntegrationStatus,

}
