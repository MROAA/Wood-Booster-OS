import express from "express"


import {

  registerSpacemonkeyMount

} from "./services/spacemonkey/spacemonkeyRouteMountRegistry.js"



import {

  mountSpacemonkeySystem

} from "./services/spacemonkey/spacemonkeyMountOrchestrator.js"







const app = express()







registerSpacemonkeyMount({

  id:

    "os",

  path:

    "/api/spacemonkey/os",

  status:

    "active"

})







registerSpacemonkeyMount({

  id:

    "kernel",

  path:

    "/api/spacemonkey/kernel",

  status:

    "active"

})







console.log(

  JSON.stringify(

    mountSpacemonkeySystem({

      app

    }),

    null,

    2

  )

)
