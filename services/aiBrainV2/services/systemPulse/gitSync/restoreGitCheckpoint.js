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


    if(
      error.message.includes(
        "nothing to commit"
      )
    ){

      return {

        success:true,

        committed:false,

        message:
          "Nothing to commit"

      }

    }





    return {

      success:false,

      error:
        error.message

    }


  }


}





export {

  createRestoreCheckpoint

}
