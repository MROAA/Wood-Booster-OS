/*
=====================================

SPACEMONKEY ROUTE MANAGER

Yhdistää:

- Route Manifest
- Route Registry
- Route Loader
- Route Health

Hallinnoi Spacemonkey routejen tilaa.

Ei käynnistä Expressiä.

=====================================
*/


import {

  createRouteManifest

} from "./spacemonkeyRouteManifest.js"



import {

  registerSpacemonkeyRoute

} from "./spacemonkeyRouteRegistry.js"



import {

  loadSpacemonkeyRoutes

} from "./spacemonkeyRouteLoader.js"



import {

  checkRouteHealth

} from "./spacemonkeyRouteHealth.js"







function registerRoute({

  id,

  name,

  path,

  version = "1.0.0",

  type = "api"

}){


  const manifest =

    createRouteManifest({

      id,

      name,

      path,

      version,

      type

    })







  const registry =

    registerSpacemonkeyRoute(

      manifest

    )







  const health =

    checkRouteHealth(

      manifest

    )







  const loader =

    loadSpacemonkeyRoutes()







  return {


    success:

      registry.success,


    route:

      manifest,


    health,


    registry,


    loader


  }


}







function getRouteStatus(){


  const loader =

    loadSpacemonkeyRoutes()







  return {


    ...loader,


    health:

      loader.routes.map(

        route =>

          checkRouteHealth(

            route

          )

      )

  }


}







export {

  registerRoute,

  getRouteStatus

}
