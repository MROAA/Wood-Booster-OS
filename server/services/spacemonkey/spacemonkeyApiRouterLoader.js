/*
=====================================

SPACEMONKEY API ROUTER LOADER

Lataa rekisteröidyt Spacemonkey
API routerit.

Ei käynnistä Expressiä.

Vain hallittu lataus.

=====================================
*/


import {

  getSpacemonkeyApiRoutes

} from "./spacemonkeyApiRegistry.js"







function loadSpacemonkeyApiRouters(){


  const routes =

    getSpacemonkeyApiRoutes()







  return {


    success:true,


    system:

      "Spacemonkey API Router Loader",


    version:

      "1.0.0",


    routers:

      routes.map(

        route => ({

          id:

            route.id,


          version:

            route.version,


          status:

            route.status

        })

      ),


    count:

      routes.length,


    createdAt:

      new Date().toISOString()


  }


}







export {

  loadSpacemonkeyApiRouters

}
