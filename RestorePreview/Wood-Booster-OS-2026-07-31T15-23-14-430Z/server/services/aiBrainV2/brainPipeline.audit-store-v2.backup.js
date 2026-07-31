/*
=====================================
WOOD-BOOSTER AI BRAIN V2

BRAIN PIPELINE

Vastuut:
- vastaanottaa käyttäjän viestin
- analysoi vuorovaikutuksen
- suorittaa Reasoning Modulen
- suorittaa Decision Modulen
- suorittaa päätöksen valitseman moduulin
- Capability Layer voi tarkentaa päätöstä
- palauttaa koko ketjun tulokset

=====================================
*/


import {
  ensureDefaultBrainModules,
} from "./index.js"


import {
  createCapabilityAuditSnapshot,
} from "./services/capabilityExecution/capabilityAuditSnapshot.js"

import {
  addAuditRecord,
} from "./services/capabilityExecution/capabilityAuditStore.js"

import {
  canExecuteCapability,
} from "./services/capabilityExecution/capabilityExecutionManager.js"

import {
  executeBrainModuleById,
} from "./moduleExecutor.js"


import {
  analyzeInteraction,
} from "./system/interactionEngine.js"


import {
  enrichReasoningResult,
} from "./services/moduleCapability/reasoningCapabilityBridge.js"


import {
  applyCapabilityOverride,
} from "./services/moduleCapability/decisionOverrideBridge.js"





function createPipelineRequestId(){

  const timestamp =
    Date.now()
      .toString(36)


  const randomPart =
    Math.random()
      .toString(36)
      .slice(2,10)


  return (
    `pipeline-${timestamp}-` +
    randomPart
  )

}





function normalizeMessage(value){

  return String(
    value || "",
  )
  .trim()

}





function createInvalidPipelineResult({
  requestId,
  message,
  startedAt,
}){

  const completedAt =
    new Date()


  return {

    success:
      false,

    status:
      "invalid_request",

    requestId,

    message,


    stages:{

      interaction:null,

      reasoning:null,

      decision:null,

      execution:null,

    },


    finalOutput:null,


    error:{

      code:
        "INVALID_MESSAGE",

      message:
        "AI Brain Pipeline tarvitsee käsiteltävän viestin.",

    },


    startedAt:
      startedAt.toISOString(),


    completedAt:
      completedAt.toISOString(),


    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),

  }

}





function createPipelineFailure({
  requestId,
  message,
  status,
  stages,
  error,
  startedAt,
}){

  const completedAt =
    new Date()


  return {

    success:false,

    status,

    requestId,

    message,

    stages,

    finalOutput:null,

    error,


    startedAt:
      startedAt.toISOString(),


    completedAt:
      completedAt.toISOString(),


    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),

  }

}





function createCompletedPipelineResult({
  requestId,
  message,
  stages,
  executionResult,
  startedAt,
}){

  const completedAt =
    new Date()


  return {

    success:true,

    status:
      "completed",

    requestId,

    message,

    stages,


    finalOutput:
      executionResult.output,


    error:null,


    startedAt:
      startedAt.toISOString(),


    completedAt:
      completedAt.toISOString(),


    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),

  }

}







async function runBrainPipeline({

  message,

  source =
    "brain-pipeline",

  runtimeContext = {},

} = {}){


  const startedAt =
    new Date()



  const requestId =
    createPipelineRequestId()



  const normalizedMessage =
    normalizeMessage(
      message,
    )



  if(
    !normalizedMessage
  ){

    return createInvalidPipelineResult({

      requestId,

      message:
        normalizedMessage,

      startedAt,

    })

  }



  ensureDefaultBrainModules()



  const request = {

    requestId,

    message:
      normalizedMessage,

  }





  const interaction =
    analyzeInteraction(
      normalizedMessage,
    )





  const baseRuntimeContext = {

    ...runtimeContext,


    requestId,


    source:
      String(
        source ||
        runtimeContext.source ||
        "brain-pipeline",
      )
      .trim(),


    pipeline:true,


    pipelineStartedAt:
      startedAt.toISOString(),


    interaction,

  }





  const stages = {

    interaction:{

      success:true,

      status:
        "completed",

      output:
        interaction,

      error:null,

    },


    reasoning:null,

    decision:null,

    execution:null,

  }







  const reasoningResult =
    await executeBrainModuleById({

      moduleId:
        "reasoning",

      message:
        normalizedMessage,


      request,


      runtimeContext:{

        ...baseRuntimeContext,


        reasoningOnly:true,

      },

    })





  stages.reasoning =
    reasoningResult





  if(
    !reasoningResult.success
  ){

    return createPipelineFailure({

      requestId,

      message:
        normalizedMessage,

      status:
        "reasoning_failed",

      stages,

      error:
        reasoningResult.error,

      startedAt,

    })

  }







  const reasoningAnalysis =
    reasoningResult.output?.analysis
    ||
    null





  const enrichedReasoning =
    enrichReasoningResult({

      reasoningResult:
        reasoningResult.output,


      message:
        normalizedMessage,

    })





  if(
    !reasoningAnalysis
  ){

    return createPipelineFailure({

      requestId,

      message:
        normalizedMessage,


      status:
        "reasoning_failed",


      stages,


      error:{

        code:
          "REASONING_ANALYSIS_MISSING",

        message:
          "Reasoning Module ei palauttanut analyysiä.",

      },


      startedAt,

    })

  }








  const decisionResult =
    await executeBrainModuleById({

      moduleId:
        "decision",


      message:
        normalizedMessage,


      request,


      runtimeContext:{

        ...baseRuntimeContext,


        decisionOnly:true,


        reasoningAnalysis,


        capabilityContext:
          enrichedReasoning.capabilityContext,

      },


    })





  stages.decision =
    decisionResult





  if(
    !decisionResult.success
  ){

    return createPipelineFailure({

      requestId,

      message:
        normalizedMessage,


      status:
        "decision_failed",


      stages,


      error:
        decisionResult.error,


      startedAt,

    })

  }







  const rawDecisionOutput =
    decisionResult.output
    ||
    null





  const decisionOutput =
    applyCapabilityOverride({

      decisionOutput:
        rawDecisionOutput,


      capabilityContext:
        enrichedReasoning
          .capabilityContext,

    })





  // Capability Override näkyväksi pipeline-tulokseen

  stages.decision.output =
    decisionOutput





  if(
    decisionOutput.decision === "clarify"
  ){

    return createPipelineFailure({

      requestId,

      message:
        normalizedMessage,

      status:
        "clarification_required",

      stages,

      error:null,

      startedAt,

    })

  }







  const targetModule =
    String(
      decisionOutput.targetModule ||
      "",
    )
    .trim()





  if(
    !targetModule
  ){

    return createPipelineFailure({

      requestId,

      message:
        normalizedMessage,


      status:
        "target_module_missing",


      stages,


      error:{

        code:
          "TARGET_MODULE_MISSING",

        message:
          "Decision Module ei valinnut kohdemoduulia.",

      },


      startedAt,

    })

  }




  const capabilityPermission =
    canExecuteCapability(
      targetModule,
      requestId,
    )

const {
  createExecutionLog,
} =
await import(
  "./services/capabilityExecution/capabilityExecutionLogger.js"
)
if(
  capabilityPermission.status === "approval_required"
){

  return {

    success:false,

    status:
      "approval_required",

    requestId,

    message:
      normalizedMessage,

    stages,

    finalOutput:{

      type:
        "approval_required",

      answer:
        "Tämä toiminto vaatii käyttäjän hyväksynnän ennen suoritusta.",

      moduleId:
        targetModule,

      capability:
        capabilityPermission,

    },

    error:null,

    startedAt:
      startedAt.toISOString(),

    completedAt:
      new Date().toISOString(),

    durationMs:
      new Date().getTime() -
      startedAt.getTime(),

  }

}



if(
  !capabilityPermission.success
){
createExecutionLog({

  moduleId:
    targetModule,

  capability:
    targetModule,

  status:
    "approved",

  requestId,

  metadata:
    capabilityPermission,

})
  return createPipelineFailure({

    requestId,

    message:
      normalizedMessage,

    status:
      "capability_blocked",

    stages,

    error:
      capabilityPermission,

    startedAt,

  })

}


  const executionResult =
    await executeBrainModuleById({

      moduleId:
        targetModule,


      message:
        normalizedMessage,


      request,


      runtimeContext:{

        ...baseRuntimeContext,


        reasoningAnalysis,


        decision:
          decisionOutput,


        selectedModule:
          targetModule,

      },


    })





  stages.execution =
    executionResult

stages.audit =
  createCapabilityAuditSnapshot()



  if(
    !executionResult.success
  ){

    return createPipelineFailure({

      requestId,

      message:
        normalizedMessage,


      status:
        "execution_failed",


      stages,


      error:
        executionResult.error,


      startedAt,

    })

  }







  return createCompletedPipelineResult({

    requestId,


    message:
      normalizedMessage,


    stages,


    executionResult,


    startedAt,

  })

}







export {

  runBrainPipeline,

}
