/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE

GIT SYNC WATCHER

Vastuut:

- tarkkailee GitSync tilaa
- ajaa automaattisen tarkistuksen
- estää liian tiheät commitit

Ei:
- pushaa remoteen
- muuta git historiaa

=====================================
*/


import {
  checkGitSync,
  getGitSyncStatus
} from "./gitSyncService.js"





const CHECK_INTERVAL =
  30000



const COOLDOWN =
  300000





let watcherTimer =
  null



let lastCommitTime =
  0





async function runWatcherCycle(){


  const now =
    Date.now()



  if(
    now - lastCommitTime < COOLDOWN
  ){

    return {

      success:true,

      action:
        "cooldown"

    }

  }





  const result =
    await checkGitSync()





  if(
    result.action === "commit"
  ){

    lastCommitTime =
      now

  }





  return result

}





function startGitSyncWatcher(){


  if(
    watcherTimer
  ){

    return

  }





  watcherTimer =
    setInterval(
      async ()=>{

        try {

          await runWatcherCycle()

        }
        catch(error){

          console.error(
            "GitSync watcher error:",
            error.message
          )

        }

      },
      CHECK_INTERVAL
    )


}





function stopGitSyncWatcher(){


  if(
    watcherTimer
  ){

    clearInterval(
      watcherTimer
    )


    watcherTimer =
      null

  }

}





export {

  startGitSyncWatcher,

  stopGitSyncWatcher,

  runWatcherCycle,

  getGitSyncStatus

}
