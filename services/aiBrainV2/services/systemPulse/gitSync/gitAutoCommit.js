/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE
GIT AUTO COMMIT

Vastuut:

- tarkistaa git muutokset
- luo turvallisen checkpoint commitin

Ei:
- pushaa automaattisesti
- poista tiedostoja
- muuta historiaa

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
      "git add ."
    )





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
