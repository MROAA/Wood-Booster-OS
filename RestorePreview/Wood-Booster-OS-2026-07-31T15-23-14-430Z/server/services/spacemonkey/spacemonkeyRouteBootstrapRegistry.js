/*
=====================================

SPACEMONKEY ROUTE BOOTSTRAP REGISTRY

Rekisteröi Spacemonkey API mountit.

Ei käynnistä Expressiä.

Vain route metadata.

=====================================
*/


import {

  registerSpacemonkeyMount

} from "./spacemonkeyRouteMountRegistry.js"







function registerSpacemonkeyRoutes(){


  const routes = [


    {

      id:

        "os",

      path:

        "/api/spacemonkey/os",

      status:

        "active"

    },


    {

      id:

        "kernel",

      path:

        "/api/spacemonkey/kernel",

      status:

        "active"

    },


    {

      id:

        "system",

      path:

        "/api/spacemonkey/system",

      status:

        "active"

    },


    {

      id:

        "snapshot-v3",

      path:

        "/api/spacemonkey/snapshot-v3",

      status:

        "active"

    },


    {

      id:

        "api-catalog",

      path:

        "/api/spacemonkey/api-catalog",

      status:

        "active"

    }


  ]







  routes.forEach(

    route => {


      registerSpacemonkeyMount(

        route

      )


    }

  )







  return {


    success:true,


    system:

      "Spacemonkey Route Bootstrap Registry",


    version:

      "1.0.0",


    routes,


    count:

      routes.length,


    status:

      "active",


    createdAt:

      new Date().toISOString()


  }


}







export {

  registerSpacemonkeyRoutes

}
