/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE

RESTORE SERVICE

Turvallinen palautuksen valmistelu

Ei korvaa nykyistä projektia

=====================================
*/


import fs from "fs/promises"

import path from "path"





const BACKUP_ROOT =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS/Backups"


const RESTORE_ROOT =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS/RestorePreview"





async function prepareRestore(
  snapshotName
){


  try {


    const snapshotPath =
      path.join(
        BACKUP_ROOT,
        snapshotName
      )





    await fs.access(
      snapshotPath
    )





    const restorePath =
      path.join(
        RESTORE_ROOT,
        snapshotName
      )





    await fs.mkdir(
      RESTORE_ROOT,
      {
        recursive:true
      }
    )





    await fs.cp(
      snapshotPath,
      restorePath,
      {
        recursive:true
      }
    )





    return {

      success:true,

      snapshot:
        snapshotName,

      restorePreview:
        restorePath,

      message:
        "Restore preview created"

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





export {

  prepareRestore

}
