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





async function createRestoreCheckpoint(){


  try {


    const {
      stdout:
      statusOutput
    } =
    await execAsync(
      "git status --porcelain"
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
      "git add -A"
    )





    const {
      stdout
    } =
    await execAsync(
      'git commit -m "Before System Pulse Restore"'
    )





    return {

      success:true,

      committed:true,

      message:
        stdout.trim()

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
