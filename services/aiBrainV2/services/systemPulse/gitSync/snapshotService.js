/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE

SNAPSHOT SERVICE

Vastuut:

- luo projektin snapshotin
- tallentaa Backups kansioon
- tekee git checkpointin ennen snapshotia

Ei:
- poista vanhoja backuppeja
- muuta git historiaa
- pushaa remoteen

=====================================
*/


import {
  exec
} from "child_process"

import {
  promisify
} from "util"

import fs from "fs/promises"

import path from "path"


import {
  gitAutoCommit
} from "./gitAutoCommit.js"





const execAsync =
  promisify(exec)





const PROJECT_ROOT =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS"


const BACKUP_ROOT =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS/Backups"





async function createSnapshot(){


  try {


    const commit =
      await gitAutoCommit()





    const timestamp =
      new Date()
        .toISOString()
        .replace(
          /[:.]/g,
          "-"
        )





    const snapshotName =
      `Wood-Booster-OS-${timestamp}`





    const snapshotPath =
      path.join(
        BACKUP_ROOT,
        snapshotName
      )





    await fs.mkdir(
      snapshotPath,
      {
        recursive:true
      }
    )





    await execAsync(
      `
      rsync -a \
      --exclude ".git" \
      --exclude "node_modules" \
      "${PROJECT_ROOT}/" \
      "${snapshotPath}/"
      `
    )





    return {


      success:true,


      snapshot:snapshotName,


      path:snapshotPath,


      git:commit


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

  createSnapshot

}
