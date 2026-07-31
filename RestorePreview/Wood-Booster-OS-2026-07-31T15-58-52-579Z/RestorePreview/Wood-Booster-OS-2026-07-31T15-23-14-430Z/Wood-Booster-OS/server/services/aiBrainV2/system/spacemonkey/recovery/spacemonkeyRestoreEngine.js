/*
==================================================

SPACEMONKEY RESTORE ENGINE

Dry Run palautusmoottori.

Vastuut:

- lukee snapshot tiedoston
- validoi rakenteen
- valmistaa palautuksen
- luo audit merkinnän

Ei:

- muuta oikeita tiedostoja
- suorita automaattista palautusta
- ohita hyväksyntää

Version 1.0.0

==================================================
*/


import fs from "fs/promises"


import {

  createSnapshotAuditRecord,

} from "../snapshots/spacemonkeySnapshotAuditService.js"







async function loadSnapshot({

  snapshotPath,

} = {}) {


  if(
    !snapshotPath
  ){

    return {

      success:false,

      error:
        "Snapshot path missing"

    }

  }



  try {


    const content =
      await fs.readFile(

        snapshotPath,

        "utf-8"

      )



    const snapshot =
      JSON.parse(
        content
      )



    return {

      success:true,

      snapshot

    }


  }


  catch(error){


    return {

      success:false,

      error:
        error.message

    }

  }

}








function validateSnapshotStructure({

  snapshot,

} = {}) {


  if(
    !snapshot
  ){

    return {

      valid:false,

      reason:
        "Snapshot missing"

    }

  }




  if(
    !snapshot.state
  ){

    return {

      valid:false,

      reason:
        "Snapshot state missing"

    }

  }




  return {

    valid:true

  }

}








async function prepareRestoreDryRun({

  snapshotPath,

} = {}) {



  const loaded =
    await loadSnapshot({

      snapshotPath

    })





  if(
    !loaded.success
  ){

    return {

      success:false,

      status:
        "snapshot_load_failed",

      message:
        loaded.error

    }

  }





  const validation =
    validateSnapshotStructure({

      snapshot:
        loaded.snapshot

    })





  if(
    !validation.valid
  ){

    return {

      success:false,

      status:
        "invalid_snapshot",

      message:
        validation.reason

    }

  }






  const audit =
    await createSnapshotAuditRecord({

      event:
        "restore_dry_run_completed",


      module:
        "Restore Engine",


      changeType:
        "restore",


      risk:
        "high",


      snapshot:
        snapshotPath,


      status:
        "dry_run",


      message:
        "Restore dry run completed successfully."

    })







  return {

    success:true,


    status:
      "restore_ready",


    mode:
      "dry_run",


    snapshot:
      loaded.snapshot,


    audit,


    message:
      "Restore validated safely. No files changed."

  }


}







export {

  loadSnapshot,

  validateSnapshotStructure,

  prepareRestoreDryRun

}
