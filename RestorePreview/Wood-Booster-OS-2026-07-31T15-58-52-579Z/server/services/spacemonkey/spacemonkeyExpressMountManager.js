/*
=====================================

SPACEMONKEY EXPRESS MOUNT MANAGER

Lataa Spacemonkey Routerit
ja asentaa ne Expressiin.

Debug-versio.

=====================================
*/


import {
  loadSpacemonkeyRoutes
} from "./spacemonkeyRouteLoader.js"


import {
  mountSpacemonkeyRouter
} from "./spacemonkeyExpressMountAdapter.js"



function mountSpacemonkeyExpressRoutes({

  app

}){


  console.log(
    "SPACEMONKEY MOUNT START"
  )


  const routes =
    loadSpacemonkeyRoutes()



  const mountedRoutes = []



  routes.forEach(

    route => {


      console.log(
        "MOUNTING:",
        route.path
      )


      const result =
        mountSpacemonkeyRouter({

          app,

          path:
            route.path,

          router:
            route.router

        })


      mountedRoutes.push({

        id:
          route.id,

        path:
          route.path,

        mounted:
          result.mounted

      })


    }

  )



  console.log(
    "SPACEMONKEY MOUNT COMPLETE",
    mountedRoutes
  )


  return {

    success:true,

    system:
      "Spacemonkey Express Mount Manager",

    version:
      "1.0.0",

    routes:
      mountedRoutes,

    count:
      mountedRoutes.length,

    status:
      "active",

    createdAt:
      new Date().toISOString()

  }


}


export {

  mountSpacemonkeyExpressRoutes

}
