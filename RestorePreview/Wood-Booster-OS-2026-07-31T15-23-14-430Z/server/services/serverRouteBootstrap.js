import {
  runSpacemonkeyServerEnhancer,
} from "./spacemonkeyServerEnhancer.js"




export function runServerRouteBootstrap(app){


  console.log(
    "SERVER ROUTE BOOTSTRAP START"
  )



  runSpacemonkeyServerEnhancer(
    app
  )



  console.log(
    "SERVER ROUTE BOOTSTRAP READY"
  )


}
