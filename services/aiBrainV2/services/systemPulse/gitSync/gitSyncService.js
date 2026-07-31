/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE

GIT SYNC SERVICE

Vastuut:

- tarjoaa System Pulsen git sync toiminnon
- kutsuu GitSync Controlleria
- pitää tilan yksinkertaisena

Ei:
- suorita jatkuvaa loopia vielä
- pushaa remoteen
- muuta git historiaa

=====================================
*/


import {
  runGitSync
} from "./gitSyncController.js"





let lastSyncResult = {

  status:
    "idle",

  checkedAt:
    null

}





async function checkGitSync(){


  const result =
    await runGitSync()



  lastSyncResult = {

    ...result,

    checkedAt:
      new Date().toISOString()

  }



  return lastSyncResult

}





function getGitSyncStatus(){


  return lastSyncResult


}





export {

  checkGitSync,

  getGitSyncStatus

}
