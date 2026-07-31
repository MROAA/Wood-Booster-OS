/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SPACEMONKEY RUNTIME CONTEXT PROVIDER V11


Vastuut:

- rakentaa Spacemonkey runtime context
- yhdistää kernel
- yhdistää persoonallisuus
- yhdistää response style
- yhdistää knowledge layer
- yhdistää context fusion
- lisää debug raportin


Ei:

- ei kutsu LLM:ää
- ei tee päätöksiä
- ei kirjoita muistia


=====================================
*/


import {
  createSpacemonkeyKernelContext,
} from "./spacemonkeyKernelAdapter.js"



import {
  createSpacemonkeyPersonalityContext,
} from "../../../services/spacemonkey/spacemonkeyPersonalityRuntime.js"



import {
  createSpacemonkeyResponseStyleContext,
} from "../../../services/spacemonkey/spacemonkeyResponseStyleRuntime.js"



import {
  buildUnifiedKnowledgeContext,
} from "../knowledge/builders/unifiedKnowledgeContextBuilder.js"



import {
  executeContextOrchestration,
} from "../context/orchestrator/contextOrchestrator.js"



import {
  createContextFusion,
} from "../context/fusion/contextFusionEngine.js"



import {
  createContextDebugReport,
} from "../context/debug/contextDebugReporter.js"







function createSpacemonkeyRuntimeContext({

  runtimeContext = {},

  message = "",

} = {}){


  const spacemonkeyContext =

    createSpacemonkeyKernelContext()





  const personalityContext =

    createSpacemonkeyPersonalityContext()





  const responseStyleContext =

    createSpacemonkeyResponseStyleContext()





  const knowledgeContext =

    buildUnifiedKnowledgeContext(

      message

    )







  const orchestration =

    executeContextOrchestration({

      message,

      knowledge:

        knowledgeContext.knowledge,

    })







  const fusionContext =

    createContextFusion({

      orchestration

    })







  const debugContext =

    createContextDebugReport({

      message,

      orchestration,

      fusion:

        fusionContext

    })







  return {


    ...runtimeContext,



    message,



    spacemonkey:

      spacemonkeyContext,



    spacemonkeyPersonality:

      personalityContext,



    spacemonkeyResponseStyle:

      responseStyleContext,



    spacemonkeyKnowledge:

      knowledgeContext,



    spacemonkeyContextFusion:

      fusionContext,



    spacemonkeyContextDebug:

      debugContext,



    spacemonkeyRuntimeEnabled:

      true,



    spacemonkeyPersonalityEnabled:

      true,



    spacemonkeyResponseStyleEnabled:

      true,



    spacemonkeyKnowledgeEnabled:

      true,



    spacemonkeyKernelVersion:

      spacemonkeyContext
        ?.kernelStatus
        ?.version ||
      null


  }


}







function getSpacemonkeyRuntimeContextStatus(){


  const context =

    createSpacemonkeyRuntimeContext()



  return {


    system:

      "Spacemonkey Runtime Context Provider",



    version:

      "11.0.0",



    status:

      "READY",



    knowledgeEnabled:

      context.spacemonkeyKnowledgeEnabled,



    fusionEnabled:

      Boolean(
        context.spacemonkeyContextFusion
      ),



    debugEnabled:

      Boolean(
        context.spacemonkeyContextDebug
      ),



    knowledgeSources:

      context
        ?.spacemonkeyKnowledge
        ?.totalSources ||
      0



  }


}







export {

  createSpacemonkeyRuntimeContext,

  getSpacemonkeyRuntimeContextStatus

}
