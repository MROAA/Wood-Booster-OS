import {

  registerRoute,

  getRouteStatus

} from "./services/spacemonkey/spacemonkeyRouteManager.js"







registerRoute({

  id:

    "modules",

  path:

    "/spacemonkey/modules"

})







console.log(

  JSON.stringify(

    getRouteStatus(),

    null,

    2

  )

)
