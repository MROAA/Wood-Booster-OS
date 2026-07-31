import {

  registerModule

} from "./services/spacemonkey/spacemonkeyModuleManager.js"



import {

  registerRoute

} from "./services/spacemonkey/spacemonkeyRouteManager.js"



import {

  getSpacemonkeySystemSnapshot

} from "./services/spacemonkey/spacemonkeySystemSnapshotAdapter.js"







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

    getSpacemonkeySystemSnapshot(),

    null,

    2

  )

)
