/*
=====================================

SPACEMONKEY SYSTEM KERNEL V10

MVP INTEGRATION CORE


Yhdistää:

- Runtime
- Identity
- Personality
- Memory
- Knowledge
- Events
- Security
- Tools
- Creator Intelligence
- Internet Safety
- Learning


Ei:

- tee AI päätöksiä
- kutsu LLM:ää
- suorita ulkoisia toimintoja
- ohita hyväksyntöjä


=====================================
*/


import {
  createSpacemonkeyRuntime,
} from "./spacemonkeyRuntime.js"



import {
  getMemoryIntegrationStatus,
} from "./spacemonkeyMemoryIntegration.js"



import {
  getSpacemonkeyKnowledgeAdapterStatus,
} from "./spacemonkeyKnowledgeIntegrationAdapter.js"



import {
  getSpacemonkeyEventIntegrationStatus,
} from "./spacemonkeyEventIntegration.js"



import {
  getSpacemonkeySecurityIntegrationStatus,
} from "./spacemonkeySecurityIntegration.js"



import {
  getSpacemonkeyToolsIntegrationStatus,
} from "./spacemonkeyToolsIntegration.js"



import {
  getSpacemonkeyCreatorIntelligenceStatus,
} from "./spacemonkeyCreatorIntelligenceIntegration.js"



import {
  getSpacemonkeyInternetIntegrationStatus,
} from "./spacemonkeyInternetIntegration.js"



import {
  getSpacemonkeyLearningIntegrationStatus,
} from "./spacemonkeyLearningIntegration.js"



import {
  getSpacemonkeyPersonalityStatus,
} from "./spacemonkeyPersonalityRuntime.js"







function createKernelMetadata(){


  return {


    system:

      "Spacemonkey System Kernel",



    version:

      "10.0.0",



    mode:

      "mvp",



    createdAt:

      new Date()
        .toISOString()


  }

}







function createIntegrationStatus(){


  return {



    personality:

      getSpacemonkeyPersonalityStatus(),



    memory:

      getMemoryIntegrationStatus(),



    knowledge:

      getSpacemonkeyKnowledgeAdapterStatus(),



    events:

      getSpacemonkeyEventIntegrationStatus(),



    security:

      getSpacemonkeySecurityIntegrationStatus(),



    tools:

      getSpacemonkeyToolsIntegrationStatus(),



    creatorIntelligence:

      getSpacemonkeyCreatorIntelligenceStatus(),



    internet:

      getSpacemonkeyInternetIntegrationStatus(),



    learning:

      getSpacemonkeyLearningIntegrationStatus()


  }

}







function createSpacemonkeySystemKernel({

  knowledge = [],

  memory = [],

  personality = null,

  security = null,

  system = null,

} = {}){


  const runtime =

    createSpacemonkeyRuntime({

      knowledge,

      memory,

      personality,

      security,

      system,

    })





  return {



    metadata:

      createKernelMetadata(),



    status:

      "READY",



    runtime,



    integrations:

      createIntegrationStatus(),



    capabilities:

      {


        ...runtime.capabilities,



        personality:

          true,



        creatorIntelligence:

          true,



        events:

          true,



        tools:

          true,



        internet:

          true,



        learning:

          true,


      }


  }


}







function getSpacemonkeyKernelStatus(
  kernel
){


  return {


    success:

      true,



    system:

      kernel?.metadata?.system ||

      "unknown",



    version:

      kernel?.metadata?.version ||

      "unknown",



    status:

      kernel?.status ||

      "unknown",



    capabilities:

      kernel?.capabilities ||

      {},



    integrations:

      kernel?.integrations ||

      {},



    timestamp:

      new Date()
        .toISOString()


  }

}







export {


  createSpacemonkeySystemKernel,

  getSpacemonkeyKernelStatus


}
