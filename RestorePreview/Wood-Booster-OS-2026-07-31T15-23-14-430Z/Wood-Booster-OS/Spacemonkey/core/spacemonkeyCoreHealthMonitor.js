import {
  loadSpacemonkeyCore,
} from "./spacemonkeyCoreLoader.js"


import {
  getEnabledModules,
} from "./spacemonkeyModuleResolver.js"


import fs from "fs"

import path from "path"

import {
  fileURLToPath,
} from "url"





const __filename =
  fileURLToPath(
    import.meta.url
  )


const __dirname =
  path.dirname(
    __filename
  )





const healthHistory = []







function checkFile(
  fileName
){


  const filePath =

    path.join(
      __dirname,
      fileName
    )



  return {

    file:

      fileName,


    exists:

      fs.existsSync(
        filePath
      )

  }

}







function runCoreHealthCheck(){


  const coreFiles = [

    "spacemonkeyGodFileIndex.json",

    "spacemonkeyCoreRegistry.json",

    "spacemonkeyRuntimeConfig.json"

  ]





  const files =

    coreFiles.map(
      file =>
        checkFile(file)
    )





  const core =

    loadSpacemonkeyCore()





  const modules =

    getEnabledModules()





  const missingFiles =

    files.filter(

      item =>

        !item.exists

    )





  const status =


    missingFiles.length === 0 &&

    core &&

    modules.length > 0

      ?

      "READY"

      :

      "ERROR"







  const health = {


    system:

      "Spacemonkey Central Core",


    status,


    files,


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


    checks:

      {

        coreLoaded:

          Boolean(core),


        registryLoaded:

          Boolean(
            core?.registry
          ),


        runtimeLoaded:

          Boolean(
            core?.runtime
          )

      },


    createdAt:

      new Date().toISOString()

  }





  healthHistory.push(
    health
  )





  return health

}







function getLatestHealth(){


  return (

    healthHistory[

      healthHistory.length - 1

    ]

    ||

    null

  )

}







function getHealthStatus(){


  return {


    engine:

      "Spacemonkey Core Health Monitor",


    version:

      "1.0.0",


    checks:

      healthHistory.length

  }

}







export {

  runCoreHealthCheck,

  getLatestHealth,

  getHealthStatus

}
