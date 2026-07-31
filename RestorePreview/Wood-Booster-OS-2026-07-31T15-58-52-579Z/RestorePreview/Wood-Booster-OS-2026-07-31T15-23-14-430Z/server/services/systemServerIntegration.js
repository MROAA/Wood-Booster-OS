import {
  startSystemModules,
} from "./systemModuleStartup.js"



import {
  loadSystemRoutes,
} from "./systemRoutes.js"



import {
  integrateSystemActivity,
} from "./systemActivityIntegration.js"





export function integrateSystemLayer(app){


  console.log(
    "SYSTEM LAYER INTEGRATION START"
  )



  startSystemModules()



  loadSystemRoutes(
    app
  )



  integrateSystemActivity(
    app
  )



  console.log(
    "SYSTEM LAYER INTEGRATION READY"
  )


}
