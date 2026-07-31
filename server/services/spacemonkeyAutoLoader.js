import {
  runSpacemonkeyRouteBootstrap,
} from "./spacemonkeyRouteBootstrap.js"




export function mountSpacemonkeyExtensions(app){


  console.log(
    "SPACEMONKEY EXTENSION LOADER START"
  )


  runSpacemonkeyRouteBootstrap(
    app
  )


  console.log(
    "SPACEMONKEY EXTENSION LOADER READY"
  )


}
