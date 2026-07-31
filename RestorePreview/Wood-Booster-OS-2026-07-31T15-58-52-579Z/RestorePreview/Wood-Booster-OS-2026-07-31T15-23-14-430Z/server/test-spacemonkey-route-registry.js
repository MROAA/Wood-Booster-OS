import {

  registerSpacemonkeyRoute,

  getSpacemonkeyRoutes

} from "./services/spacemonkey/spacemonkeyRouteRegistry.js"





registerSpacemonkeyRoute({

  id:"modules",

  path:"/spacemonkey/modules",

  version:"1.0.0",

  status:"active"

})





console.log(

  JSON.stringify(

    getSpacemonkeyRoutes(),

    null,

    2

  )

)
