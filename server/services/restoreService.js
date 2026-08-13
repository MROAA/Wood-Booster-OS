import {
  execFile,
} from "child_process"

import {
  access,
} from "fs/promises"

import path from "path"

import {
  createSnapshot,
} from "./backupService.js"

import {
  verifyRecovery,
} from "./aiBrainV2/services/systemPulse/recoveryVerification.js"



const BACKUP_DIR =
"/home/marc/Wood-Booster-AI/backups"


const PROJECT_DIR =
"/home/marc/Wood-Booster-AI"



function execFileAsync(
  command,
  args,
){

  return new Promise(
    (
      resolve,
      reject,
    ) => {

      execFile(
        command,
        args,
        {
          maxBuffer:
            1024 * 1024 * 100,
        },
        (
          error,
          stdout,
          stderr,
        ) => {

          if(error){

            reject({

              success:false,

              error:
                stderr ||
                error.message,

            })

            return

          }


          resolve(stdout)

        },
      )

    },
  )

}



export async function restoreSnapshot(
  file,
  {
    confirm,
  } = {},
){


  if(!file){

    throw {

      success:false,

      error:
        "Snapshot file missing",

    }

  }



  if(confirm !== true){

    throw {

      success:false,

      error:
        "Restore requires explicit confirmation",

    }

  }



  const snapshotPath =
    path.join(
      BACKUP_DIR,
      file,
    )



  try {

    await access(
      snapshotPath,
    )

  }

  catch {

    throw {

      success:false,

      error:
        `Snapshot not found: ${file}`,

    }

  }



  let safetyBackup = null



  try {

    const safety =
      await createSnapshot()


    safetyBackup =
      path.basename(
        safety.file,
      )

  }

  catch(error){

    throw {

      success:false,

      error:
        `Safety backup failed, restore aborted: ${
          error.error ||
          error.message
        }`,

    }

  }



  try {

    await execFileAsync(
      "tar",
      [
        "-xzf",
        snapshotPath,
        "-C",
        PROJECT_DIR,
      ],
    )

  }

  catch(error){

    throw {

      success:false,

      error:
        `Restore extraction failed (safety backup ${
          safetyBackup
        } was created before this attempt): ${
          error.error
        }`,

    }

  }



  const verification =
    await verifyRecovery()



  return {

    success:true,


    message:
      "Restore completed successfully",


    restoredFrom:
      file,


    safetyBackup,


    verification,


  }

}
