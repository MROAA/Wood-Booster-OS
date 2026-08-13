/*
=====================================

WOOD-BOOSTER AI BRAIN V2

GIT SYNC WATCHER

Vastuut:

- valvoo Git tilaa automaattisesti
- tunnistaa muutokset
- tallentaa vain merkittävät tapahtumat

Ei:
- tee committeja
- tee pushia
- tee pullia

=====================================
*/


import {
  getGitSyncStatus,
} from "./gitSyncMonitor.js"



import {
  addGitSyncEvent,
} from "./gitSyncHistory.js"





let watcherActive =
  false



let intervalId =
  null



let lastState =
  null



let lastChange =
  null





function startGitSyncWatcher(
  interval = 30000,
){


  if(
    watcherActive
  ){

    return {

      active:true,

      message:
        "Git Sync Watcher already running"

    }

  }





  watcherActive =
    true





  async function check(){


    const current =
      getGitSyncStatus()





    if(
      !lastState
    ){


      await addGitSyncEvent({

        type:
          "INITIAL_CHECK",


        status:
          current.state,


        repository:
          current.repository,


        branch:
          current.branch,


        commit:
          current.commit,


        changedFiles:
          current.changedFiles,


      })


    }





    else if(
      JSON.stringify(current)
      !==
      JSON.stringify(lastState)
    ){


      lastChange = {

        previous:
          lastState,


        current,


        changedAt:
          new Date()
            .toISOString(),

      }





      await addGitSyncEvent({

        type:
          "CHANGE_DETECTED",


        status:
          current.state,


        repository:
          current.repository,


        branch:
          current.branch,


        commit:
          current.commit,


        changedFiles:
          current.changedFiles,


      })


    }





    lastState =
      current


  }





  check()



  intervalId =
    setInterval(
      check,
      interval
    )





  return {

    active:true,

    interval,

  }


}







function getGitSyncWatcherStatus(){


  return {

    active:
      watcherActive,


    lastState,


    lastChange,


    checkedAt:
      new Date()
        .toISOString(),

  }


}







function stopGitSyncWatcher(){


  if(
    intervalId
  ){

    clearInterval(
      intervalId
    )

  }


  watcherActive =
    false



  intervalId =
    null


}







export {

  startGitSyncWatcher,

  getGitSyncWatcherStatus,

  stopGitSyncWatcher,

}
