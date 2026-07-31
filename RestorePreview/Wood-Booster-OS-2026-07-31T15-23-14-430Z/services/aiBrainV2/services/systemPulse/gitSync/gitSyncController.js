/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE

GIT SYNC CONTROLLER

Vastuut:

- valvoo git muutoksia
- päättää voiko automaattinen commit tapahtua
- suojaa liian suurilta muutoksilta

Ei:
- pushaa automaattisesti
- muuta git historiaa
- poista tiedostoja

=====================================
*/


import {
  exec
} from "child_process"

import {
  promisify
} from "util"


import {
  gitAutoCommit
} from "./gitAutoCommit.js"





const execAsync =
  promisify(exec)





const MAX_CHANGED_FILES = 500





async function getChangedFileCount(){

  const result =
    await execAsync(
      "git status --short"
    )


  if(
    !result.stdout.trim()
  ){

    return 0

  }


  return result.stdout
    .trim()
    .split("\n")
    .length

}





async function runGitSync(){

  try {


    const changedFiles =
      await getChangedFileCount()





    if(
      changedFiles === 0
    ){

      return {

        success:true,

        action:
          "idle",

        changedFiles:0,

        message:
          "Repository clean"

      }

    }





    if(
      changedFiles > MAX_CHANGED_FILES
    ){

      return {

        success:false,

        action:
          "blocked",

        changedFiles,

        message:
          "Too many changed files. Manual review required."

      }

    }





    const commitResult =
      await gitAutoCommit()





    return {

      success:
        commitResult.success,

      action:
        "commit",

      changedFiles,

      result:
        commitResult

    }


  }
  catch(error){


    return {

      success:false,

      action:
        "error",

      error:
        error.message

    }


  }

}





export {

  runGitSync

}
