/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE

RESTORE CONFIRM SERVICE

Turvallinen palautuksen valmistelu

=====================================
*/


import fs from "fs/promises"

import path from "path"





const RESTORE_ROOT =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS/RestorePreview"


const PROJECT_ROOT =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS"


const SAFETY_BACKUP_ROOT =
  "/home/marc/Wood-Booster-AI/Wood-Booster-Restore-Backups"





async function confirmRestore(
  snapshotName
){


  try {


    const restorePath =
      path.join(
        RESTORE_ROOT,
        snapshotName
      )





    await fs.access(
      restorePath
    )





    const currentBackup =
      path.join(
        SAFETY_BACKUP_ROOT,
        `before-restore-${Date.now()}`
      )





    await fs.mkdir(
      currentBackup,
      {
        recursive:true
      }
    )





    const entries =
      await fs.readdir(
        PROJECT_ROOT
      )





    for(
      const entry
      of entries
    ){

      if(
        entry === "node_modules" ||
        entry === ".git" ||
        entry === "Backups" ||
        entry === "RestorePreview"
      ){

        continue

      }





      await fs.cp(
        path.join(
          PROJECT_ROOT,
          entry
        ),
        path.join(
          currentBackup,
          entry
        ),
        {
          recursive:true
        }
      )

    }





    return {

      success:true,

      snapshot:
        snapshotName,

      backupBeforeRestore:
        currentBackup,

      message:
        "Current system backed up before restore"

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

  confirmRestore

}
