/*
==================================================

SPACEMONKEY RECOVERY CONTROLLER

Yhdistää Recovery-järjestelmän moduulit.

Vastuut:

- käynnistää turvallisen palautusprosessin
- hakee palautuspisteen
- luo hyväksyntäpyynnön
- palauttaa tilan

Ei:
- suorita palautusta
- ohita hyväksyntää
- muuta järjestelmää

==================================================
*/


import {

  prepareRecovery,

} from "../snapshots/spacemonkeyRecoveryManager.js"



import {

  createRecoveryApproval,

} from "./spacemonkeyRecoveryApprovalService.js"








async function requestRecovery({

  reason =
    "Manual recovery request",

} = {}) {



  const recovery =
    await prepareRecovery({

      reason

    })





  if(
    !recovery.success
  ){

    return {

      success:false,

      status:
        recovery.status ||
        "failed",

      message:
        recovery.message

    }

  }







  const approval =
    await createRecoveryApproval({

      snapshot:
        recovery.snapshot,


      reason

    })







  if(
    !approval.success
  ){

    return {

      success:false,

      status:
        "approval_creation_failed",

      recovery,

      message:
        approval.error

    }

  }








  return {

    success:true,


    status:
      "approval_required",


    snapshot:
      recovery.snapshot,


    approval:
      approval.approval,


    audit:
      recovery.audit,


    message:
      "Recovery prepared. Waiting for user approval."

  }


}








function getRecoveryControllerStatus(){


  return {

    system:
      "Spacemonkey Recovery Controller",


    version:
      "1.0.0",


    safety: {

      automaticRestore:
        false,


      approvalRequired:
        true,


      auditEnabled:
        true

    }

  }

}







export {

  requestRecovery,

  getRecoveryControllerStatus

}
