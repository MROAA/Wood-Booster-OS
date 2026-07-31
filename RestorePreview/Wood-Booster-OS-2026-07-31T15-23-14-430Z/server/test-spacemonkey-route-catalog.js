import {

  registerRoute

} from "./services/spacemonkey/spacemonkeyRouteManager.js"



import {

  createRouteCatalog

} from "./services/spacemonkey/spacemonkeyRouteCatalog.js"







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

    createRouteCatalog(),

    null,

    2

  )

)
