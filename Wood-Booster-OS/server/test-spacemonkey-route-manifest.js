import {

  createRouteManifest

} from "./services/spacemonkey/spacemonkeyRouteManifest.js"



console.log(

  JSON.stringify(

    createRouteManifest({

      id:"modules",

      name:"Spacemonkey Modules API",

      path:"/spacemonkey/modules"

    }),

    null,

    2

  )

)
