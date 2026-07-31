/*
=====================================

SPACEMONKEY SYSTEM SNAPSHOT

Yhdistää:

- Core
- Modules
- Routes
- Health

Read-only.

Ei muuta järjestelmää.

=====================================
*/


import {

  getSpacemonkeyModules

} from "./spacemonkeyModuleRegistry.js"



import {

  createRouteCatalog

} from "./spacemonkeyRouteCatalog.js"







function createSystemSnapshot(){


  const modules =

    getSpacemonkeyModules()







  const routes =

    createRouteCatalog()







  return {


    system:

      "Spacemonkey System Snapshot",


    version:

      "2.0.0",





    core:


      {


        status:

          "active",


        version:

          "1.0.0"


      },





    modules:


      modules.map(

        module => ({


          id:

            module.id,


          name:

            module.name,


          version:

            module.version,


          state:

            module.state || "unknown"


        })

      ),





    routes:

      routes.routes,





    health:


      {


        status:

          "healthy",


        modules:

          modules.length,


        routes:

          routes.routes.length


      },





    createdAt:

      new Date().toISOString()


  }


}







export {

  createSystemSnapshot

}
