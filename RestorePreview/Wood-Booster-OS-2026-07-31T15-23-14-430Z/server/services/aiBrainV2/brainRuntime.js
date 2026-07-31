/*
=====================================
WOOD-BOOSTER AI BRAIN V2

BRAIN RUNTIME V5

Vastuut:

- vastaanottaa AI Brain pyynnön
- validoi pyynnön
- muodostaa runtime-kontekstin
- lisää Spacemonkey Kernel contextin
- lisää Knowledge Layer contextin
- käynnistää Brain Orchestratorin
- käyttää Spacemonkey Guard -kerroksia
- palauttaa runtime-vastauksen


Ei:

- ei tee päätöksiä
- ei reititä moduuleja
- ei kutsu kielimallia
- ei suorita työkaluja


=====================================
*/


import {
  runBrainOrchestrator,
} from "./brainOrchestrator.js"



import {
  createSpacemonkeyRuntimeContext,
} from "./services/spacemonkeyRuntimeContextProvider.js"



import {
  validateSpacemonkeyIdentityResponse,
} from "../spacemonkey/spacemonkeyResponseIdentityGuard.js"



import {
  validateSpacemonkeyBehaviorResponse,
} from "../spacemonkey/spacemonkeyBehaviorGuard.js"



function createRequestId(){

  const timestamp =
    Date.now()
      .toString(36)


  const randomPart =
    Math.random()
      .toString(36)
      .slice(2,10)


  return (
    `brain-${timestamp}-` +
    randomPart
  )

}



function normalizeMessage(value){

  return String(
    value ||
    "",
  ).trim()

}



function normalizeSource({
  source,
  runtimeContext,
}){

  return String(
    source ||
    runtimeContext?.source ||
    "unknown",
  ).trim()
  ||
  "unknown"

}



function createRuntimeContext({

  requestId,

  source,

  runtimeContext,

  startedAt,

  message,

}){


  const baseContext = {


    ...runtimeContext,


    requestId,


    source,


    runtime:
      true,


    runtimeRequestId:
      requestId,


    runtimeStartedAt:
      startedAt.toISOString()

  }



  return createSpacemonkeyRuntimeContext({

    runtimeContext:
      baseContext,


    message,

  })

}



function applySpacemonkeyGuards(output){


  if(
    !output ||
    typeof output !== "object"
  ){

    return {

      output,

      identityGuardApplied:false,

      behaviorGuardApplied:false,

    }

  }



  if(
    typeof output.answer !== "string"
  ){

    return {

      output,

      identityGuardApplied:false,

      behaviorGuardApplied:false,

    }

  }



  const identityResult =
    validateSpacemonkeyIdentityResponse({

      answer:
        output.answer,

    })



  const behaviorResult =
    validateSpacemonkeyBehaviorResponse({

      answer:
        identityResult.answer,

    })



  return {


    output:{

      ...output,

      answer:
        behaviorResult.answer,

    },


    identityGuardApplied:

      identityResult.changed,


    behaviorGuardApplied:

      behaviorResult.changed,

  }


}



function createCompletedResult({

  requestId,

  message,

  source,

  orchestratorResult,

  context,

  startedAt,

}){


  const completedAt =
    new Date()



  const guarded =
    applySpacemonkeyGuards(
      orchestratorResult.finalOutput
    )



  return {


    success:true,


    status:
      orchestratorResult.status,


    requestId,


    message,


    output:
      guarded.output,


    error:null,


    metadata:{


      runtime:true,


      orchestratorExecuted:true,


      identityGuardApplied:

        guarded.identityGuardApplied,


      behaviorGuardApplied:

        guarded.behaviorGuardApplied,


      spacemonkeyRuntimeLoaded:

        context
          ?.spacemonkeyRuntimeEnabled ||
        false,


      spacemonkeyKnowledgeLoaded:

        context
          ?.spacemonkeyKnowledgeEnabled ||
        false,


      spacemonkeyKnowledgeSources:

        context
          ?.spacemonkeyKnowledge
          ?.totalSources ||
        0,


      spacemonkeyKernelVersion:

        context
          ?.spacemonkeyKernelVersion ||
        null,


      source

    },


    startedAt:
      startedAt.toISOString(),


    completedAt:
      completedAt.toISOString(),


    durationMs:
      completedAt.getTime() -
      startedAt.getTime()

  }


}



async function runBrainRuntime({

  message,

  source,

  runtimeContext = {},

} = {}){


  const startedAt =
    new Date()



  const requestId =
    createRequestId()



  const normalizedMessage =
    normalizeMessage(
      message
    )



  if(!normalizedMessage){

    return {

      success:false,

      status:"invalid_request",

      error:{
        code:"INVALID_MESSAGE"
      }

    }

  }



  const normalizedSource =
    normalizeSource({

      source,

      runtimeContext

    })



  const context =
    createRuntimeContext({

      requestId,

      source:
        normalizedSource,

      runtimeContext,

      startedAt,

      message:
        normalizedMessage,

    })



  try{


    const orchestratorResult =
      await runBrainOrchestrator({

        message:
          normalizedMessage,


        source:
          normalizedSource,


        runtimeContext:
          context

      })



    return createCompletedResult({

      requestId,

      message:
        normalizedMessage,

      source:
        normalizedSource,

      orchestratorResult,

      context,

      startedAt

    })


  }

  catch(error){

    return {

      success:false,

      status:"runtime_error",

      error:{
        message:
          error.message
      }

    }

  }


}



export {

  runBrainRuntime,

}
