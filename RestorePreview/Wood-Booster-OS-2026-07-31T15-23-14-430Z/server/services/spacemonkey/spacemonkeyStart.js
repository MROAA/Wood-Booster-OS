/*
=====================================

SPACEMONKEY START

Keskitetty käynnistyspiste.

Yhdistää:

- Route Bootstrap Registry
- Bootstrap Orchestrator
- Express Mount Manager

=====================================
*/


import {

  registerSpacemonkeyRoutes

} from "./spacemonkeyRouteBootstrapRegistry.js"



import {

  bootSpacemonkeySystem

} from "./spacemonkeyBootstrapOrchestrator.js"



import {

  mountSpacemonkeyExpressRoutes

} from "./spacemonkeyExpressMountManager.js"







function startSpacemonkey({

  app

}){


  const routes =

    registerSpacemonkeyRoutes()







  const bootstrap =

    bootSpacemonkeySystem()







  const mounts =

    mountSpacemonkeyExpressRoutes({

      app

    })







  return {


    success:true,


    system:

      "Spacemonkey Start",


    version:

      "1.0.0",


    status:

      "active",


    routes,


    bootstrap,


    mounts,


    createdAt:

      new Date().toISOString()


  }


}







export {

  startSpacemonkey

}
