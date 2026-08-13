import {
  getCoreAPIStatus,
} from "./spacemonkeyCoreAPI.js"





const snapshotHistory = []







function getSpacemonkeySnapshot(){


  const core =

    getCoreAPIStatus()





  const snapshot = {


    system:

      "Spacemonkey Core Snapshot",



    version:

      "1.0.0",



    status:

      "READY",



    core,



    health:

    {

      identity:

        Boolean(
          core.identity
        ),


      values:

        Boolean(
          core.values
        ),


      runtime:

        Boolean(
          core.runtime
        ),


      memory:

        Boolean(
          core.memory
        ),


      loader:

        Boolean(
          core.core
        )

    },



    createdAt:

      new Date().toISOString()

  }





  snapshotHistory.push(

    snapshot

  )





  return snapshot

}







function getSnapshotHistory(){


  return [

    ...snapshotHistory

  ]

}







function getSnapshotStatus(){


  return {


    engine:

      "Spacemonkey Core Snapshot",



    version:

      "1.0.0",



    snapshots:

      snapshotHistory.length

  }

}







export {

  getSpacemonkeySnapshot,

  getSnapshotHistory,

  getSnapshotStatus

}
