import {

  registerSpacemonkeyRoutes

} from "./services/spacemonkey/spacemonkeyRouteBootstrapRegistry.js"



import {

  getSpacemonkeyMounts

} from "./services/spacemonkey/spacemonkeyRouteMountRegistry.js"





console.log(

  JSON.stringify(

    registerSpacemonkeyRoutes(),

    null,

    2

  )

)



console.log(

  JSON.stringify(

    getSpacemonkeyMounts(),

    null,

    2

  )

)
