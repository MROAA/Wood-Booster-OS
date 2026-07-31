import {
  createCapabilityContext,
} from "./moduleCapabilityAdapter.js"



function createDecisionCapabilityContext(
  message,
) {

  const capabilityContext =
    createCapabilityContext(
      message,
    )


  if (
    !capabilityContext.success
  ) {

    return {

      success:
        false,

      message,

      decisionContext:
        null,

      error:
        capabilityContext.error,

    }

  }



  return {

    success:
      true,


    message,


    decisionContext: {

      availableCapabilities:
        capabilityContext.capabilities,


      primaryCapability:
        capabilityContext
          .capabilities[0]
          || null,


      source:
        "module-capability-context",

      version:
        "1.0.0",

    },

  }

}



export {
  createDecisionCapabilityContext,
}	
