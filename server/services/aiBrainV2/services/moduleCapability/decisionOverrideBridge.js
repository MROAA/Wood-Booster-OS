import {
  resolveCapabilityTarget,
} from "../../data/capabilityRegistry/capabilityTargetResolver.js"


import {
  checkCapabilityPermission,
} from "../../data/capabilityRegistry/capabilityPermissionGuard.js"



const MIN_OVERRIDE_CONFIDENCE = 10



function applyCapabilityOverride({

  decisionOutput,

  capabilityContext,

}) {


  if(
    !decisionOutput ||
    decisionOutput.decision !== "delegate"
  ){

    return {

      ...decisionOutput,

      overrideApplied:
        false,

      overrideReason:
        "Ei ohitettu: decision ei ole delegate.",

    }

  }



  if(
    decisionOutput.targetModule !== "conversation"
  ){

    return {

      ...decisionOutput,

      overrideApplied:
        false,

      overrideReason:
        "Ei ohitettu: tarkka moduulivalinta jo tehty.",

    }

  }



  const primaryModule =
    capabilityContext
      ?.primaryModule
    ||
    null



  if(
    !primaryModule
  ){

    return {

      ...decisionOutput,

      overrideApplied:
        false,

      overrideReason:
        "Ei ohitettu: capability-osumaa ei löytynyt.",

    }

  }



  if(
    primaryModule.confidence <
    MIN_OVERRIDE_CONFIDENCE
  ){

    return {

      ...decisionOutput,

      overrideApplied:
        false,

      overrideReason:
        "Ei ohitettu: confidence liian matala.",

    }

  }



  const target =
    resolveCapabilityTarget(
      primaryModule.moduleId,
    )



  if(
    !target
  ){

    return {

      ...decisionOutput,

      overrideApplied:
        false,

      overrideReason:
        "Ei ohitettu: kohdemoduulia ei löytynyt rekisteristä.",

    }

  }



  const permission =
    checkCapabilityPermission(
      target.moduleId,
    )



  if(
    !permission.allowed
  ){

    return {

      ...decisionOutput,

      overrideApplied:
        false,

      overrideReason:
        "Ei ohitettu: capability Permission Guard esti suorituksen.",

      permission,

    }

  }



  return {

    ...decisionOutput,


    targetModule:
      target.moduleId,


    reason:
      `Ohitettu: capability löysi vahvan osuman moduulille "${target.moduleId}" (confidence ${primaryModule.confidence}).`,


    overrideApplied:
      true,


    overrideReason:
      "Capability Registry ja Permission Guard hyväksyivät kohdemoduulin.",


    overrideSource: {

      moduleId:
        target.moduleId,


      confidence:
        primaryModule.confidence,


      permission,

    },

  }

}



export {
  applyCapabilityOverride,
}
