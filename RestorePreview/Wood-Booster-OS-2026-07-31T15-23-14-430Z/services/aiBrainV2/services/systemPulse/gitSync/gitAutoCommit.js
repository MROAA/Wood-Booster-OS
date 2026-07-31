/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE

GIT AUTO COMMIT

=====================================
*/


import {
  exec
} from "child_process"

import {
  promisify
} from "util"



const execAsync =
  promisify(exec)





async function gitAutoCommit(){


  try {


    const status =
      await execAsync(
        "git status --porcelain"
      )



    if(
      !status.stdout.trim()
    ){

      return {

        success:true,

        changed:false,

        message:
          "No changes detected"

      }

    }





    await execAsync(
      "git add .gitignore services"
    )





    const staged =
      await execAsync(
        "git diff --cached --name-only"
      )



    if(
      !staged.stdout.trim()
    ){

      return {

        success:true,

        changed:false,

        message:
          "Nothing staged"

      }

    }





    const commit =
      await execAsync(
        'git commit -m "System Pulse automatic checkpoint"'
      )





    return {

      success:true,

      changed:true,

      commit:
        commit.stdout.trim()

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

  gitAutoCommit

}
