/*
=====================================

SPACEMONKEY ROUTE LOADER

Lataa Spacemonkey Express Routerit.

Sisältää:

- OS
- Kernel
- System
- Snapshot V3
- API Catalog

Ei käynnistä serveriä.

=====================================
*/


import {

  createSpacemonkeyOSRouter

} from "../../routes/spacemonkeyOS.js"



import {

  createSpacemonkeyKernelApiRouter

} from "../../routes/spacemonkeyKernelApi.js"



import {

  createSpacemonkeySystemRouter

} from "../../routes/spacemonkeySystem.js"



import {

  createSpacemonkeySnapshotRouter

} from "../../routes/spacemonkeySnapshot.js"



import {

  createSpacemonkeyApiCatalogRouter

} from "../../routes/spacemonkeyApiCatalog.js"







function loadSpacemonkeyRoutes(){


  return [


    {

      id:

        "os",

      path:

        "/api/spacemonkey/os",

      router:

        createSpacemonkeyOSRouter()

    },


    {

      id:

        "kernel",

      path:

        "/api/spacemonkey/kernel",

      router:

        createSpacemonkeyKernelApiRouter()

    },


    {

      id:

        "system",

      path:

        "/api/spacemonkey/system",

      router:

        createSpacemonkeySystemRouter()

    },


    {

      id:

        "snapshot-v3",

      path:

        "/api/spacemonkey/snapshot-v3",

      router:

        createSpacemonkeySnapshotRouter()

    },


    {

      id:

        "api-catalog",

      path:

        "/api/spacemonkey/api-catalog",

      router:

        createSpacemonkeyApiCatalogRouter()

    }


  ]


}







export {

  loadSpacemonkeyRoutes

}
