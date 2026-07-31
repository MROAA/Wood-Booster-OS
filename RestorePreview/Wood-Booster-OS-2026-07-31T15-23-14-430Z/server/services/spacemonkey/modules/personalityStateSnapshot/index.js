const MODULE_ID = "personality-state-snapshot"



const snapshots = []



function createSnapshot({

  version,

  traits,

  activeRules,

  memoryState,

  safetyState,

}){

  const snapshot = {

    id:
      `personality-snapshot-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    version,

    state:

      {

        traits:
          traits || [],

        activeRules:
          activeRules || [],

        memoryState:
          memoryState || "unknown",

        safetyState:
          safetyState || "unknown",

      },

    status:
      "stored",

  }


  snapshots.push(snapshot)


  return snapshot

}



function getSnapshots(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      snapshots.length,

    snapshots,

  }

}



function getLatestSnapshot(){

  if (
    snapshots.length === 0
  ){

    return null

  }


  return snapshots[
    snapshots.length - 1
  ]

}



function restoreSnapshot(id){

  const snapshot =
    snapshots.find(
      item =>
        item.id === id
    )


  if (!snapshot){

    return {

      success:
        false,

      reason:
        "Snapshot not found.",

    }

  }



  return {

    success:
      true,

    restoredState:
      snapshot.state,

    message:
      "Personality restoration proposal created.",

  }

}



export {

  MODULE_ID,

  createSnapshot,

  getSnapshots,

  getLatestSnapshot,

  restoreSnapshot,

}
