import {
  bootstrapSystem,
} from "./systemBootstrap.js"





export function startSystemRuntime(app){


  console.log(
    "SYSTEM RUNTIME START"
  )



  try{


    bootstrapSystem(
      app
    )



    console.log(
      "SYSTEM RUNTIME READY"
    )


  }
  catch(error){


    console.error(

      "SYSTEM RUNTIME FAILED",

      error

    )


  }


}
