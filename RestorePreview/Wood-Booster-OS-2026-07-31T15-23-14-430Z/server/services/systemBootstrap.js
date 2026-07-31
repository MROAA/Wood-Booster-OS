import {
  mountSystemModules,
} from "./systemModuleRegistry.js"





export function bootstrapSystem(app){


  console.log(
    "SYSTEM BOOTSTRAP START"
  )



  try{


    mountSystemModules(
      app
    )



    console.log(
      "SYSTEM BOOTSTRAP COMPLETE"
    )


  }
  catch(error){


    console.error(

      "SYSTEM BOOTSTRAP FAILED",

      error

    )


  }


}
