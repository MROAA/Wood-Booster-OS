/*
==================================================

SPACEMONKEY RESTORE EXECUTOR

Turvallinen palautusmoottori.

Vastuut:

- tarkistaa hyväksytyn palautuksen
- validoi snapshotin
- valmistelee palautuksen
- kirjoittaa audit tapahtuman

Ei:
- suorita vaarallisia muutoksia
- ohita hyväksyntää
- poista historiaa

Ensimmäinen MVP-versio:
RESTORE PREPARED

==================================================
*/


import fs from "fs/promises"


import prisma from "../../../../../prisma.js"


import {

  createSnapshotAuditRecord,

} from "../snapshots/spacemonkeySnapshotAuditService.js"








async function validateApproval({

  approvalId,

} = {}){


  const approval =
    await prisma
      .spacemonkeyApproval
      .findUnique({

        where: {

          id:
            approvalId

        }

      })





  if(
    !approval
  ){

    return {

      valid:false,

      reason:
        "Approval not found"

    }

  }





  if(
    !approval.approved
  ){

    return {

      valid:false,

      reason:
        "Approval not granted"

    }

  }





  return {

    valid:true,

    approval

  }

}









async function validateSnapshot({

  filePath,

} = {}){


  if(
    !filePath
  ){

    return {

      valid:false,

      reason:
        "Snapshot path missing"

    }

  }





  try {

    await fs.access(
      filePath
    )


    return {

      valid:true,

      filePath

    }

  }


  catch(error){


    return {

      valid:false,

      reason:
        "Snapshot file missing"

    }

  }

}









async function executeRestore({

  approvalId,

} = {}){


  const approvalCheck =
    await validateApproval({

      approvalId

    })





  if(
    !approvalCheck.valid
  ){

    return {

      success:false,

      status:
        "approval_failed",

      message:
        approvalCheck.reason

    }

  }





  const approval =
    approvalCheck.approval





  const snapshotCheck =
    await validateSnapshot({

      filePath:
        approval.filePath

    })





  if(
    !snapshotCheck.valid
  ){

    return {

      success:false,

      status:
        "snapshot_failed",

      message:
        snapshotCheck.reason

    }

  }







  const audit =
    await createSnapshotAuditRecord({

      event:
        "restore_prepared",


      module:
        "Restore Executor",


      changeType:
        "restore",


      risk:
        "high",


      snapshot:
        approval.filePath,


      status:
        "prepared",


      message:
        "Restore validated and prepared."

    })







  return {

    success:true,

    status:
      "restore_prepared",

    approval,

    snapshot:

      approval.filePath,


    audit,


    message:
      "Restore prepared. Execution requires next approval step."

  }


}







export {

  executeRestore,

  validateApproval,

  validateSnapshot

}
