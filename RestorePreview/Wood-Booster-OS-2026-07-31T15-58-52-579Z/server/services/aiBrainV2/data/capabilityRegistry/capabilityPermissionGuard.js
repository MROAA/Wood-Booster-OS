import {
  getCapabilityExecution,
} from "./capabilityExecutionMap.js"



function checkCapabilityPermission(
  capabilityId,
){

  const execution =
    getCapabilityExecution(
      capabilityId,
    )


  if(
    !execution ||
    !execution.execution
  ){

    return {

      success:
        false,

      allowed:
        false,

      capabilityId,

      reason:
        "Capability execution metadata puuttuu.",

    }

  }



  if(
    execution.requiresApproval
  ){

    return {

      success:
        true,

      allowed:
        true,

      capabilityId,

      execution:
        execution.execution,

      requiresApproval:
        true,

      permissions:
        execution.permissions,

      reason:
        "Capability löytyi, mutta vaatii hyväksynnän.",

    }

  }



  return {

    success:
      true,

    allowed:
      true,

    capabilityId,

    execution:
      execution.execution,

    requiresApproval:
      false,

    permissions:
      execution.permissions,

    reason:
      "Capability sallittu automaattiseen suoritukseen.",

  }

}



export {
  checkCapabilityPermission,
}
