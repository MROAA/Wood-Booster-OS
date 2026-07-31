/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SPACEMONKEY BRAIN CONTEXT ADAPTER V1


Vastuut:

- yhdistää Spacemonkey Runtime Contextin
- muuntaa AI Brain käyttömuotoon
- tarjoaa yhden context-rajapinnan


Ei:

- ei muuta Brain ydintä
- ei kutsu LLM:ää
- ei tee päätöksiä


=====================================
*/



import {
  createAIBrainContextInjection,
} from "./aiBrainContextInjectionAdapter.js"







function createSpacemonkeyBrainContext({

  runtimeContext = {},

} = {}){


  const fusionContext =

    runtimeContext
      .spacemonkeyContextFusion






  const injection =

    createAIBrainContextInjection({

      fusionContext:

        fusionContext || {}

    })







  return {


    source:

      "spacemonkey-brain-context-adapter",



    version:

      "1.0.0",



    runtime:

      runtimeContext.spacemonkey || null,



    personality:

      runtimeContext.spacemonkeyPersonality || null,



    responseStyle:

      runtimeContext.spacemonkeyResponseStyle || null,



    knowledge:

      injection.systemContext,



    memory:

      injection.memoryContext,



    projects:

      injection.projectContext,



    metadata:

      injection.metadata


  }


}







export {

  createSpacemonkeyBrainContext

}
