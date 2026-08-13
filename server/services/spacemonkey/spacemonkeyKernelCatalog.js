/*
=====================================

SPACEMONKEY KERNEL CATALOG

Yhdistää Spacemonkey
järjestelmän näkyvyyden.

Read-only.

Ei suorita moduuleja.

=====================================
*/


import {

  createSystemSnapshot

} from "./spacemonkeySystemSnapshot.js"



import {

  getGatewayStatus

} from "./spacemonkeyGatewayManager.js"



import {

  getSpacemonkeySystemPulseStatus

} from "./spacemonkeySystemPulseIntegration.js"







async function createKernelCatalog(){


  const snapshot =

    createSystemSnapshot()







  const gateway =

    getGatewayStatus()







  const systemPulse =

    await getSpacemonkeySystemPulseStatus()







  return {


    system:

      "Spacemonkey Kernel Catalog",


    version:

      "1.0.0",





    core:

      snapshot.core,





    modules:

      snapshot.modules,





    routes:

      snapshot.routes,





    health:

      snapshot.health,





    systemPulse,





    gateway:


      {


        apis:

          gateway.apis,


        routers:

          gateway.routers


      },





    createdAt:

      new Date().toISOString()


  }


}







export {

  createKernelCatalog

}