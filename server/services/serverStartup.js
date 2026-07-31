import {
  enhanceServer,
} from "./serverEnhancer.js"



import {
  loadSystemRoutes,
} from "./systemRoutes.js"



import {
  startSystemModules,
} from "./systemModuleStartup.js"





export function runServerStartup(app){


  console.log(
    "SERVER STARTUP INITIALIZING"
  )



  try{


    startSystemModules()



    enhanceServer(
      app
    )



    loadSystemRoutes(
      app
    )



    console.log(
      "SERVER STARTUP COMPLETE"
    )


  }
  catch(error){


    console.error(

      "SERVER STARTUP FAILED",

      error

    )


  }


}
