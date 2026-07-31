/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE

RESTORE GIT CHECKPOINT

Luo Git-pisteen ennen palautusta

=====================================
*/


import {
  exec
} from "child_process"


import {
  promisify
} from "util"





const execAsync =
  promisify(
    exec
  )





const EXEC_OPTIONS = {

  maxBuffer:
    1024 * 1024

}





async function createRestoreCheckpoint(){


  try {


    const {
      stdout:
      statusOutput
    } =
    await execAsync(
      "git status --porcelain",
      EXEC_OPTIONS
    )





    if(
      !statusOutput.trim()
    ){

      return {

        success:true,

        committed:false,

        message:
          "No changes to checkpoint"

      }

    }





    await execAsync(
      "git add -A",
      EXEC_OPTIONS
    )





    await execAsync(
      'git commit -m "Before System Pulse Restore"',
      EXEC_OPTIONS
    )





    return {

      success:true,

      committed:true,

      message:
        "Git checkpoint created"

    }


  }
  catch(error){


    return {

      success:false,

      error:
        error.stderr ||
        error.message

    }


  }


}





export {

  createRestoreCheckpoint

}
