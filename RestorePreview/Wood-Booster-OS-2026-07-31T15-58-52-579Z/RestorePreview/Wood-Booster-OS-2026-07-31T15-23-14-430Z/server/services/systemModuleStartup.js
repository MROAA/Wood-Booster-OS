import {
  loadDefaultSystemModules,
} from "./defaultSystemModules.js"



export function startSystemModules(){


  console.log(
    "SYSTEM MODULE STARTUP"
  )



  loadDefaultSystemModules()



  console.log(
    "SYSTEM MODULE STARTUP COMPLETE"
  )


}
