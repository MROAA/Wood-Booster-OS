import {

  checkModuleHealth

} from "./services/spacemonkey/spacemonkeyModuleHealth.js"



const result =

  checkModuleHealth({

    id:"restore",

    version:"1.0.0",

    enabled:true

  })



console.log(

  JSON.stringify(

    result,

    null,

    2

  )

)
