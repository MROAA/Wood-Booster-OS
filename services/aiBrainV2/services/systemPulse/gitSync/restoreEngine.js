/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE

RESTORE ENGINE

Palauttaa valitun snapshotin

Sisältää:
- Git checkpoint ennen palautusta
- Restore
- Restore report

=====================================
*/


import fs from "fs/promises"

import path from "path"


import {
  createRestoreReport,
} from "./restoreReportService.js"


import {
  createRestoreCheckpoint,
} from "./restoreGitCheckpoint.js"





const RESTORE_ROOT =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS/RestorePreview"


const PROJECT_ROOT =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS"





async function executeRestore(
  snapshotName
){


  const startedAt =
    new Date()



  try {


    const checkpoint =
      await createRestoreCheckpoint()





    const restorePath =
      path.join(
        RESTORE_ROOT,
        snapshotName
      )





    await fs.access(
      restorePath
    )





    const entries =
      await fs.readdir(
        restorePath
      )





    for(
      const entry
      of entries
    ){


      await fs.cp(

        path.join(
          restorePath,
          entry
        ),

        path.join(
          PROJECT_ROOT,
          entry
        ),

        {
          recursive:true
        }

      )


    }





    const finishedAt =
      new Date()





    return {

      ...createRestoreReport({

        snapshot:
          snapshotName,


        restoredFiles:
          entries.length,


        startedAt,


        finishedAt,


        success:true

      }),


      gitCheckpoint:
        checkpoint

    }


  }
  catch(error){


    const finishedAt =
      new Date()





    return {

      ...createRestoreReport({

        snapshot:
          snapshotName,


        restoredFiles:
          0,


        startedAt,


        finishedAt,


        success:false

      }),


      error:
        error.message

    }


  }


}





export {

  executeRestore

}
