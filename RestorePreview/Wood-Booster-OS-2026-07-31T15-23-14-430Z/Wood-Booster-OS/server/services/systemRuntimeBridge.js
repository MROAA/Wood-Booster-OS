import {
  startSystemRuntime,
} from "./systemRuntime.js"



export function runSystemRuntimeBridge(app){


  console.log(
    "SYSTEM RUNTIME BRIDGE START"
  )



  try{


    startSystemRuntime(
      app
    )



    console.log(
      "SYSTEM RUNTIME BRIDGE READY"
    )


  }
  catch(error){


    console.error(

      "SYSTEM RUNTIME BRIDGE FAILED",

      error

    )


  }


}
