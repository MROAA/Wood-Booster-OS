import {
  resolveModuleCapabilities,
} from "./moduleCapabilityResolver.js"



function createCapabilityContext(
  message,
) {

  const result =
    resolveModuleCapabilities(
      message,
    )


  if (
    !result.success
  ) {

    return {

      success:
        false,

      message,

      capabilities:
        [],

      error:
        result.error,

    }

  }



  return {

    success:
      true,


    message,


    capabilities:

      result.matches.map(
        module => ({

          moduleId:
            module.id,

          moduleName:
            module.name,

          confidence:
            module.score,

          description:
            module.description,

        }),
      ),


    metadata: {

      source:
        "module-capability-resolver",

      version:
        "1.0.0",

    },

  }

}



function getPrimaryCapability(
  message,
) {

  const context =
    createCapabilityContext(
      message,
    )


  if (
    !context.success ||
    context.capabilities.length === 0
  ) {

    return null

  }


  return context.capabilities[0]

}



export {
  createCapabilityContext,
  getPrimaryCapability,
}
