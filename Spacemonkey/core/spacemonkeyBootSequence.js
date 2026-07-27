import {
  bootSpacemonkey,
} from "./spacemonkeyBootManager.js"


import {
  getSpacemonkeySnapshot,
} from "./spacemonkeyCoreSnapshot.js"


import {
  runHealthCheck,
} from "./spacemonkeyHealthMonitor.js"





const bootHistory = []







function startSpacemonkey(){


  const boot =

    bootSpacemonkey()





  const snapshot =

    getSpacemonkeySnapshot()





  const health =

    runHealthCheck()





  const result = {


    system:

      "Spacemonkey Boot Sequence",



    version:

      "1.0.0",



    status:

      health.status === "READY"

        ?

        "READY"

        :

        "WARNING",



    boot,



    snapshot:

    {

      version:
        snapshot.version,

      createdAt:
        snapshot.createdAt

    },



    health,



    startedAt:

      new Date().toISOString()

  }





  bootHistory.push(

    result

  )





  return result

}







function getBootHistory(){


  return [

    ...bootHistory

  ]

}







function getBootStatus(){


  return {


    engine:

      "Spacemonkey Boot Sequence",



    version:

      "1.0.0",



    boots:

      bootHistory.length

  }

}







export {

  startSpacemonkey,

  getBootHistory,

  getBootStatus

}
