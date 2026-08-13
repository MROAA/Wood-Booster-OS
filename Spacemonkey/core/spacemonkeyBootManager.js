import {
  loadSpacemonkeyCore,
} from "./spacemonkeyCoreLoader.js"


import {
  getEnabledModules,
} from "./spacemonkeyModuleResolver.js"


import {
  runCoreHealthCheck,
} from "./spacemonkeyCoreHealthMonitor.js"


import {
  createRuntimeState,
} from "./spacemonkeyRuntimeController.js"





const bootHistory = []







function bootSpacemonkey(){


  const health =

    runCoreHealthCheck()





  const core =

    loadSpacemonkeyCore()





  const runtime =

    createRuntimeState()





  const modules =

    getEnabledModules()





  const ready =


    health.status === "READY"

    &&

    runtime.status === "active"

    &&

    Boolean(core)







  const bootResult = {


    system:

      "Spacemonkey Central Core",



    status:

      ready

        ?

        "READY"

        :

        "ERROR",



    health:


      {

        status:

          health.status,


        checks:

          health.checks

      },



    runtime:


      {

        status:

          runtime.status,


        mode:

          runtime.mode,


        safeMode:

          runtime.safeMode,


        autonomousActions:

          runtime.autonomousActions

      },



    core:


      {

        version:

          core.version,


        loaded:

          Boolean(core),


        loadedAt:

          core.loadedAt

      },



    modules:


      {

        total:

          modules.length,


        active:

          modules.map(

            module =>

              module.id

          )

      },



    startedAt:

      new Date().toISOString()

  }





  bootHistory.push(

    bootResult

  )





  return bootResult

}







function getBootStatus(){


  return {


    engine:

      "Spacemonkey Boot Manager",


    version:

      "1.1.0",


    boots:

      bootHistory.length

  }

}







function getBootHistory(){


  return [

    ...bootHistory

  ]

}







export {

  bootSpacemonkey,

  getBootStatus,

  getBootHistory

}
