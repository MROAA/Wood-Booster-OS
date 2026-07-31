import {
  getCapabilityRegistry,
} from "./capabilityRegistry.js"


import {
  getCapabilityExecution,
} from "./capabilityExecutionMap.js"




function resolveCapabilityTarget(
  moduleId,
) {


  const registry =
    getCapabilityRegistry()



  if (
    !registry ||
    !Array.isArray(
      registry.capabilities,
    )
  ) {

    return null

  }




  const capability =

    registry.capabilities.find(

      item =>

        item.moduleId === moduleId

    )




  if (
    !capability
  ) {

    return null

  }




  const execution =

    getCapabilityExecution(
      moduleId,
    )





  return {


    moduleId:

      capability.moduleId,



    name:

      capability.name,



    permissions:

      capability.permissions,



    execution:

      execution?.execution ||
      "unknown",



    requiresApproval:

      execution?.requiresApproval ??
      true,



    executionPermissions:

      execution?.permissions ||
      {},



    description:

      capability.description,



    metadata: {

      source:
        "capability-target-resolver",


      version:
        "2.0.0",


    },


  }

}




export {
  resolveCapabilityTarget,
}
