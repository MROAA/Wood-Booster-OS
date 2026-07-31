import {
  registerSystemModule,
} from "./systemRegistry.js"



export function loadSystemModule({

  id,

  name,

  status,

}){


  const module = {


    id,

    name,

    status:


      status ||
      "READY"


  }



  registerSystemModule(
    module
  )



  console.log(

    `SYSTEM MODULE REGISTERED: ${name}`

  )



  return module


}
