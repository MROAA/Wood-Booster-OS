/*
=====================================

WOOD-BOOSTER AI BRAIN V2

GIT SYNC MONITOR

Vastuut:

- valvoo Git tilaa
- tarkistaa muutokset
- pitää viimeisen tarkistuksen
- tarjoaa sync tilan

Ei:
- tee pushia
- tee pullia
- muuta repositoryä

=====================================
*/


import {
  getGitIdentity,
} from "./gitIdentity.js"





let lastSyncState =
  null





function checkGitSync(){


  const git =
    getGitIdentity()



  lastSyncState = {

    active:
      true,


    repository:
      git.repository,


    branch:
      git.branch,


    commit:
      git.commit,


    state:
      git.state,


    changedFiles:
      git.changedFiles,


    checkedAt:
      git.checkedAt,


  }



  return lastSyncState


}





function getGitSyncStatus(){


  if(!lastSyncState){

    return checkGitSync()

  }


  return lastSyncState


}





export {

  checkGitSync,

  getGitSyncStatus,

}
