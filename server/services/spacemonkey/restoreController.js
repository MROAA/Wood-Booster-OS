/*
=====================================

SPACEMONKEY RESTORE CONTROLLER

DRY RUN VERSION

Ei muuta järjestelmää.

Vain suunnittelee palautuksen
ja kirjaa tapahtuman audit-lokiin.

=====================================
*/


import {

  getRestoreApproval

} from "./restoreApproval.js"



import {

  buildSpacemonkeySnapshot

} from "./snapshotAdapter.js"



import {

  createRestoreAuditEvent

} from "./restoreAudit.js"







function createRestorePlan(){


  const approval =

    getRestoreApproval()





  const snapshot =

    buildSpacemonkeySnapshot()







  if(!approval.approved){


    return {


      ready:

        false,


      status:

        "BLOCKED",


      reason:

        "Restore approval required."


    }


  }








  const plan = {


    ready:

      true,


    status:

      "DRY_RUN",



    approvedBy:

      approval.approvedBy,



    snapshot:


      {


        version:

          snapshot.version,


        core:

          snapshot.core


      },



    actions:


      [

        "Verify snapshot",

        "Verify core modules",

        "Prepare recovery environment",

        "Wait for restore execution approval"

      ]



  }







  createRestoreAuditEvent({

    event:

      "RESTORE_DRY_RUN",


    user:

      approval.approvedBy,


    snapshot:

      `Spacemonkey Core v${snapshot.version}`,


    status:

      "READY"


  })







  return plan


}







export {

  createRestorePlan

}
