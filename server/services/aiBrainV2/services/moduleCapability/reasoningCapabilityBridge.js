import {
  createDecisionModuleInput,
} from "./decisionModuleAdapter.js"



function enrichReasoningResult({
  reasoningResult,
  message,
}) {


  const capabilityInput =
    createDecisionModuleInput(
      message,
    )



  if(
    !capabilityInput.success
  ){

    return {

      ...reasoningResult,

      capabilityContext:
        null,

    }

  }



  return {

    ...reasoningResult,


    capabilityContext: {

      moduleCapabilities:
        capabilityInput
          .input
          .moduleCapabilities,


      primaryModule:
        capabilityInput
          .input
          .primaryModule,


      metadata:
        capabilityInput
          .input
          .metadata,

    },

  }

}



export {
  enrichReasoningResult,
}
