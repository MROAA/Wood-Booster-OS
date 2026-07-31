import {
  getSpacemonkeySnapshot,
} from "./spacemonkeyCoreSnapshot.js"





const healthHistory = []





function runHealthCheck(){


  const snapshot =
    getSpacemonkeySnapshot()





  const checks = {


    identity:

      snapshot.health.identity
        ? "OK"
        : "ERROR",



    values:

      snapshot.health.values
        ? "OK"
        : "ERROR",



    runtime:

      snapshot.health.runtime
        ? "OK"
        : "ERROR",



    memory:

      snapshot.health.memory
        ? "OK"
        : "ERROR",



    loader:

      snapshot.health.loader
        ? "OK"
        : "ERROR"

  }





  const failedChecks =

    Object.values(checks)
      .filter(
        status =>
          status !== "OK"
      )





  const status =

    failedChecks.length === 0

      ?

      "READY"

      :

      "WARNING"







  const result = {


    system:

      "Spacemonkey Health Monitor",



    version:

      "1.0.0",



    status,



    checks,



    snapshot:



      {

        version:
          snapshot.version,

        createdAt:
          snapshot.createdAt

      },



    createdAt:

      new Date().toISOString()

  }





  healthHistory.push(

    result

  )





  return result

}







function getHealthHistory(){


  return [

    ...healthHistory

  ]

}







function getHealthStatus(){


  return {


    engine:

      "Spacemonkey Health Monitor",



    version:

      "1.0.0",



    checks:

      healthHistory.length

  }

}







export {

  runHealthCheck,

  getHealthHistory,

  getHealthStatus

}
