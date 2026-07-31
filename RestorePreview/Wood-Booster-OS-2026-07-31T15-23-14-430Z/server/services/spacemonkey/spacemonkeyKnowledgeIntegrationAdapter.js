/*
=====================================

SPACEMONKEY KNOWLEDGE INTEGRATION ADAPTER V1

Yhdistää:

Spacemonkey System Kernel
        |
        v
Spacemonkey Knowledge Adapter
        |
        v
AI Brain Knowledge Context


Vastuut:

- lataa Spacemonkey knowledge contextin
- välittää tiedon Kernelille
- tarjoaa tilatiedon


Ei:

- tallenna muistia
- kutsu LLM:ää
- tee päätöksiä
- muuta AI Brain Pipelinea

=====================================
*/


import {
  createSpacemonkeyKnowledgeContext,
} from "./knowledgeAdapter.js"



import {
  getKnowledgeIntegrationStatus,
} from "../aiBrainV2/system/spacemonkey/spacemonkeyKnowledgeIntegration.js"







async function loadSpacemonkeyKnowledgeIntegration(){

  const knowledgeContext =

    await createSpacemonkeyKnowledgeContext()



  return {

    success:
      knowledgeContext.success,


    source:

      knowledgeContext.source ||
      null,


    count:

      knowledgeContext.count ||
      0,


    context:

      knowledgeContext.context ||
      "",


    documents:

      knowledgeContext.documents ||
      [],


    integration:

      getKnowledgeIntegrationStatus()

  }

}







function injectSpacemonkeyKnowledge({

  runtimeContext = {},

  knowledgeContext = {},

} = {}){


  return {


    ...runtimeContext,


    spacemonkeyKnowledgeLoaded:
      true,


    spacemonkeyKnowledgeCount:

      knowledgeContext.count ||
      0,


    spacemonkeyKnowledgeContext:

      knowledgeContext.context ||
      "",


  }

}







function getSpacemonkeyKnowledgeAdapterStatus(){


  return {

    system:
      "Spacemonkey Knowledge Integration Adapter",

    version:
      "1.0.0",

    status:
      "READY",

    source:
      "Spacemonkey Knowledge Adapter",

    integration:
      "ACTIVE"

  }

}







export {

  loadSpacemonkeyKnowledgeIntegration,

  injectSpacemonkeyKnowledge,

  getSpacemonkeyKnowledgeAdapterStatus,

}
