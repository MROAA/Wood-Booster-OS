import {

  registerModule

} from "./services/spacemonkey/spacemonkeyModuleManager.js"





const restore =

  registerModule({

    id:

      "restore",


    name:

      "Spacemonkey Restore Module"

  })





console.log(

  JSON.stringify(

    restore,

    null,

    2

  )

)
