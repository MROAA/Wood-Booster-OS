/*
=====================================

SPACEMONKEY MODULE REGISTRY

Hallitsee Spacemonkey
moduuleita.

Ei käynnistä moduuleita.

Vain rekisteri.

=====================================
*/


import {

  createSpacemonkeyMemoryModule

} from "./modules/spacemonkeyMemoryModule.js"







function loadSpacemonkeyModules(){


  return [


    createSpacemonkeyMemoryModule()


  ]


}







function getSpacemonkeyModules(){


  return loadSpacemonkeyModules()


}







function getSpacemonkeyModuleCatalog(){


  const modules =

    getSpacemonkeyModules()







  return {


    system:

      "Spacemonkey Module Registry",


    version:

      "1.0.0",


    modules:

      modules.map(

        module => ({


          id:

            module.id,


          name:

            module.name,


          version:

            module.version,


          status:

            module.status


        })

      ),


    count:

      modules.length,


    createdAt:

      new Date().toISOString()


  }


}







export {

  loadSpacemonkeyModules,

  getSpacemonkeyModules,

  getSpacemonkeyModuleCatalog

}
