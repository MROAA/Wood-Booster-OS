import {

  loadSpacemonkeyModule

} from "./services/spacemonkey/spacemonkeyModuleLoader.js"



import {

  createModuleSnapshot

} from "./services/spacemonkey/spacemonkeyModuleSnapshot.js"





loadSpacemonkeyModule({

  id:

    "restore",

  name:

    "Spacemonkey Restore Module",

  version:

    "1.0.0",

  enabled:

    true

})





console.log(

  JSON.stringify(

    createModuleSnapshot(),

    null,

    2

  )

)
