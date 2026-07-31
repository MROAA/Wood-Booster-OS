import {

  registerModule

} from "./services/spacemonkey/spacemonkeyModuleManager.js"



import {

  createModuleCatalog

} from "./services/spacemonkey/spacemonkeyModuleCatalog.js"





registerModule({

  id:

    "restore",


  name:

    "Spacemonkey Restore Module"

})





console.log(

  JSON.stringify(

    createModuleCatalog(),

    null,

    2

  )

)
