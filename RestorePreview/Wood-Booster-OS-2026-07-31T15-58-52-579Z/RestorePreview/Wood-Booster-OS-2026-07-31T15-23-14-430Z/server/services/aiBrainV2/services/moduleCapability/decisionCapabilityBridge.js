import {
  createDecisionModuleInput,
} from "./decisionModuleAdapter.js"



function enrichDecisionRuntimeContext({
  message,
  runtimeContext = {},
}) {

  const capabilityInput =
    createDecisionModuleInput(
      message,
    )


  if (
    !capabilityInput.success
  ) {

    return {

      ...runtimeContext,

      moduleCapabilities:
        [],

      capabilityError:
        capabilityInput.error,

    }

  }



  return {

    ...runtimeContext,


    moduleCapabilities:
      capabilityInput
        .input
        .moduleCapabilities,


    primaryModuleCapability:
      capabilityInput
        .input
        .primaryModule,


    capabilityMetadata:
      capabilityInput
        .input
        .metadata,

  }

}



export {
  enrichDecisionRuntimeContext,
}
