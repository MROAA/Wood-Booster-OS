/*
=====================================

SPACEMONKEY ROUTE CATALOG

Näyttää rekisteröidyt Spacemonkey routet.

Read-only.

Ei muuta routeja.

=====================================
*/


import {

  getSpacemonkeyRoutes

} from "./spacemonkeyRouteRegistry.js"



import {

  checkRouteHealth

} from "./spacemonkeyRouteHealth.js"







function createRouteCatalog(){


  const routes =

    getSpacemonkeyRoutes()







  return {


    system:

      "Spacemonkey Route Catalog",


    version:

      "1.0.0",


    routes:


      routes.map(

        route => {


          const health =

            checkRouteHealth(

              route

            )





          return {


            id:

              route.id,


            name:

              route.name,


            path:

              route.path,


            version:

              route.version,


            status:

              route.status,


            health:

              health.status


          }


        }

      ),


    createdAt:

      new Date().toISOString()


  }


}







export {

  createRouteCatalog

}
