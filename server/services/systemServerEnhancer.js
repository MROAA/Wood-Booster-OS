import {
  integrateSpacemonkeyRoutes,
} from "./spacemonkeyRouteIntegration.js"




export function enhanceServer(app){


  console.log(
    "SERVER ENHANCER START"
  )



  integrateSpacemonkeyRoutes(
    app
  )



  console.log(
    "SERVER ENHANCER READY"
  )


}
