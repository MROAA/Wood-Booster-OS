import {
  integrateSpacemonkeyRoutes,
} from "./spacemonkeyRouteIntegration.js"




export function runSpacemonkeyServerEnhancer(app){


  console.log(
    "SPACEMONKEY SERVER ENHANCER START"
  )



  integrateSpacemonkeyRoutes(
    app
  )



  console.log(
    "SPACEMONKEY SERVER ENHANCER READY"
  )


}
