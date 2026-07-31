import {

  registerModule

} from "./services/spacemonkey/spacemonkeyModuleManager.js"



import {

  registerRoute

} from "./services/spacemonkey/spacemonkeyRouteManager.js"



import {

  createSystemSnapshot

} from "./services/spacemonkey/spacemonkeySystemSnapshot.js"







registerModule({

  id:

    "restore",

  name:

    "Spacemonkey Restore Module"

})







registerRoute({

  id:

    "modules",

  name:

    "Spacemonkey Modules API",

  path:

    "/spacemonkey/modules"

})







console.log(

  JSON.stringify(

    createSystemSnapshot(),

    null,

    2

  )

)
