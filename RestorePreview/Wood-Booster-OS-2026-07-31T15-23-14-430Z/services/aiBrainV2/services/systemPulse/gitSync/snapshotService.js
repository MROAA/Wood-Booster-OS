/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE

SNAPSHOT SERVICE

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
      --exclude "Backups" \
      "${PROJECT_ROOT}/" \
      "${snapshotPath}/"
      `,
      {
        maxBuffer:
          1024 * 1024 * 100
      }
    )





    return {

      success:true,

      snapshotCreated:true,

      snapshot:
        snapshotName,

      path:
        snapshotPath,

      gitCommit:
        commit.changed === true,

      git:
        commit,

      message:
        commit.changed
          ?
          "Snapshot created with git checkpoint."
          :
          "Snapshot created. No git changes."

    }


  }
  catch(error){


    return {

      success:false,

      snapshotCreated:false,

      error:
        error.message

    }

  }


}





export {

  createSnapshot

}
