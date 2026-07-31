/*
=====================================

WOOD-BOOSTER AI BRAIN V2

GIT SYNC SUMMARY

Vastuut:

- kokoaa Git Sync yhteen näkymään
- muodostaa terveystilan
- tarjoaa frontendille valmiin datan

=====================================
*/


import {
  getGitSyncStatus,
} from "./gitSyncMonitor.js"



import {
  getGitSyncHistory,
} from "./gitSyncHistory.js"







async function getGitSyncSummary(){


  const sync =
    getGitSyncStatus()



  const history =
    await getGitSyncHistory()





  const lastEvent =
    history?.events?.[0]





  let healthStatus =
    "offline"



  let healthLabel =
    "Offline"





  if(
    sync?.active &&
    sync?.commit
  ){

    if(
      sync.changedFiles > 0
    ){

      healthStatus =
        "changes"


      healthLabel =
        "Changes detected"

    }

    else {

      healthStatus =
        "healthy"


      healthLabel =
        "Healthy"

    }


  }





  return {


    repository:
      sync.repository,



    branch:
      sync.branch,



    status:
      sync.state,



    commit:
      sync.commit,



    changedFiles:
      sync.changedFiles,



    watcherActive:
      sync.active,





    health: {


      status:
        healthStatus,


      label:
        healthLabel,


    },





    historyCount:
      history.total,



    lastEvent:
      lastEvent?.type
      ||
      null,



    lastChecked:
      sync.checkedAt


  }


}







export {

  getGitSyncSummary,

}
