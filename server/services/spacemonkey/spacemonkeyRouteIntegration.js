/*
=====================================

SPACEMONKEY ROUTE INTEGRATION

Keskitetty Spacemonkey API routejen lataus.

Yhdistää:

- Cognitive API
- Kernel API
- System API
- Snapshot API
- Catalog API

=====================================
*/


import {

  createSpacemonkeyCognitiveRouter,

} from "../../routes/spacemonkeyCognitive.js"



import {

  mountSpacemonkeyExpressRoutes,

} from "./spacemonkeyExpressMountManager.js"







export function integrateSpacemonkeyRoutes(

  app

){


  console.log(

    "SPACEMONKEY ROUTES START"

  )





  app.use(

    "/api",

    createSpacemonkeyCognitiveRouter(

      app.locals.prisma

    )

  )





  mountSpacemonkeyExpressRoutes({

    app

  })





  console.log(

    "SPACEMONKEY ROUTES READY"

  )


}
