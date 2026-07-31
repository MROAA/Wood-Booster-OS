/*
=====================================

SPACEMONKEY MODULE SNAPSHOT

Ottaa kuvan ladatuista moduuleista.

Read-only.

Ei muuta järjestelmää.

=====================================
*/


import {

  getLoadedSpacemonkeyModules

} from "./spacemonkeyModuleLoader.js"



import {

  checkModuleHealth

} from "./spacemonkeyModuleHealth.js"







function createModuleSnapshot(){


  const modules =

    getLoadedSpacemonkeyModules()





  const snapshotModules =

    modules.map(

      module => {


        const health =

          checkModuleHealth(

            module

          )





        return {


          id:

            module.id,


          version:

            module.version,


          health:

            health.status


        }


      }

    )







  return {


    system:

      "Spacemonkey Module Snapshot",


    version:

      "1.0.0",


    status:

      "stable",


    modules:

      snapshotModules,


    createdAt:

      new Date().toISOString()


  }


}







export {

  createModuleSnapshot

}
