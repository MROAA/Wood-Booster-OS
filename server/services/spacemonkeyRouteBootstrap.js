import {
  integrateSpacemonkeyRoutes,
} from "./spacemonkeyRouteIntegration.js"





export function runSpacemonkeyRouteBootstrap(app){


  console.log(
    "SPACEMONKEY ROUTE BOOTSTRAP START"
  )



  integrateSpacemonkeyRoutes(
    app
  )



  console.log(
    "SPACEMONKEY ROUTE BOOTSTRAP READY"
  )


}
