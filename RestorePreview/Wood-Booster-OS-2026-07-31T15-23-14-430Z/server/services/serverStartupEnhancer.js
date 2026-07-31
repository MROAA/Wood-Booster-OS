import {
  runSpacemonkeyRouteBootstrap,
} from "./spacemonkeyRouteBootstrap.js"




export function runServerStartupEnhancer(app){


  console.log(
    "SERVER STARTUP ENHANCER START"
  )



  runSpacemonkeyRouteBootstrap(
    app
  )



  console.log(
    "SERVER STARTUP ENHANCER READY"
  )


}
