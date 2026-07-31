import {

  checkRouteHealth

} from "./services/spacemonkey/spacemonkeyRouteHealth.js"





console.log(

  JSON.stringify(

    checkRouteHealth({

      id:"modules",

      version:"1.0.0",

      path:"/spacemonkey/modules"

    }),

    null,

    2

  )

)
