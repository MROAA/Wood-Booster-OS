/*
=====================================

SPACEMONKEY ROUTE INTEGRATION

Keskitetty Spacemonkey API routejen lataus.

=====================================
*/


import {
  createSpacemonkeyCognitiveRouter,
} from "../../routes/spacemonkeyCognitive.js"







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



  console.log(
    "SPACEMONKEY ROUTES READY"
  )


}
