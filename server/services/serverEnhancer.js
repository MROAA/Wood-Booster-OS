import {
  runSystemRuntimeBridge,
} from "./systemRuntimeBridge.js"



export function enhanceServer(app){


  console.log(
    "SERVER ENHANCER START"
  )



  try{


    runSystemRuntimeBridge(
      app
    )


    console.log(
      "SERVER ENHANCER READY"
    )


  }
  catch(error){


    console.error(

      "SERVER ENHANCER FAILED",

      error

    )


  }


}
