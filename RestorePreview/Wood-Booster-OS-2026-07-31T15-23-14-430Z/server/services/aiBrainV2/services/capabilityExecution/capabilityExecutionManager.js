/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY EXECUTION MANAGER

Vastuut:

- vastaanottaa capability-moduulin
- tarkistaa Permission Guardin
- tekee execution-päätöksen
- kirjoittaa audit lokin

Ei suorita moduuleita.

=====================================
*/


import {
  checkCapabilityPermission,
} from "../../data/capabilityRegistry/capabilityPermissionGuard.js"


import {
  createExecutionLog,
} from "./capabilityExecutionLogger.js"



function createExecutionDecision({

  moduleId,

  requestId = null,

}) {


  const permission =
    checkCapabilityPermission(
      moduleId,
    )



  if(
    !permission.success
  ){

    const result = {

      success:false,

      status:
        "blocked",

      moduleId,

      reason:
        "Capability permission tarkistus epäonnistui.",

      permission,

    }


    createExecutionLog({

      moduleId,

      capability:
        moduleId,

      status:
        "blocked",

      requestId,

      metadata:
        result,

    })


    return result

  }





  if(
    permission.requiresApproval === true
  ){

    const result = {

      success:false,

      status:
        "approval_required",

      moduleId,

      execution:
        permission.execution,

      requiresApproval:
        true,

      permissions:
        permission.permissions,

      reason:
        "Capability vaatii käyttäjän hyväksynnän ennen suoritusta.",

      permission,

    }


    createExecutionLog({

      moduleId,

      capability:
        moduleId,

      status:
        "approval_required",

      requestId,

      metadata:
        result,

    })


    return result

  }





  const result = {

    success:true,

    status:
      "approved",

    moduleId,

    execution:
      permission.execution,

    requiresApproval:
      false,

    permissions:
      permission.permissions,

    reason:
      "Capability sallittu automaattiseen suoritukseen.",

  }


  createExecutionLog({

    moduleId,

    capability:
      moduleId,

    status:
      "approved",

    requestId,

    metadata:
      result,

  })


  return result

}





function canExecuteCapability(

  moduleId,

  requestId = null,

){

  return createExecutionDecision({

    moduleId,

    requestId,

  })

}



export {

  canExecuteCapability,

  createExecutionDecision,

}
