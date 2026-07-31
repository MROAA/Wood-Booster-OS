import {
  createDecisionCapabilityContext,
} from "./decisionCapabilityContext.js"



function createDecisionModuleInput(
  message,
) {

  const capabilityContext =
    createDecisionCapabilityContext(
      message,
    )


  if (
    !capabilityContext.success
  ) {

    return {

      success:
        false,

      message,

      input:
        null,

      error:
        capabilityContext.error,

    }

  }



  return {

    success:
      true,


    message,


    input: {

      moduleCapabilities:
        capabilityContext
          .decisionContext
          .availableCapabilities,


      primaryModule:
        capabilityContext
          .decisionContext
          .primaryCapability,


      metadata: {

        source:
          "decision-module-adapter",

        version:
          "1.0.0",

      },

    },

  }

}



function getPrimaryDecisionModule(
  message,
) {

  const result =
    createDecisionModuleInput(
      message,
    )


  if (
    !result.success
  ) {

    return null

  }


  return (
    result.input.primaryModule
    ||
    null
  )

}



export {
  createDecisionModuleInput,
  getPrimaryDecisionModule,
}
