import {
  enhanceServer,
} from "./serverEnhancer.js"



export function runServerStartup(app){


  console.log(
    "SERVER STARTUP INITIALIZING"
  )



  try{


    enhanceServer(
      app
    )



    console.log(
      "SERVER STARTUP COMPLETE"
    )


  }
  catch(error){


    console.error(

      "SERVER STARTUP FAILED",

      error

    )


  }


}
