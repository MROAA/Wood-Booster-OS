/*
=====================================

SPACEMONKEY MODULE CATALOG

Näyttää rekisteröidyt moduulit.

Lukee Registryä.

Read-only.

=====================================
*/


import {

  getSpacemonkeyModules

} from "./spacemonkeyModuleRegistry.js"



import {

  checkModuleHealth

} from "./spacemonkeyModuleHealth.js"







function createModuleCatalog(){


  const modules =

    getSpacemonkeyModules()







  return {


    system:

      "Spacemonkey Module Catalog",


    version:

      "1.0.0",


    modules:

      modules.map(

        module => {


          const health =

            checkModuleHealth(

              module

            )





          return {


            id:

              module.id,


            name:

              module.name,


            version:

              module.version,


            state:

              module.state || "unknown",


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

  createModuleCatalog

}
