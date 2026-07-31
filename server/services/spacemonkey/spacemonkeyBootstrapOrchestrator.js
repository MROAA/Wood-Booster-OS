/*
=====================================

SPACEMONKEY BOOTSTRAP ORCHESTRATOR

Yhdistää:

- Lifecycle Manager
- Health

Keskitetty käynnistys.

=====================================
*/


import {

  startSpacemonkeyBootstrap

} from "./spacemonkeyBootstrapLifecycleManager.js"



import {

  checkSpacemonkeyBootstrapHealth

} from "./spacemonkeyBootstrapHealth.js"







function bootSpacemonkeySystem(){


  const lifecycle =

    startSpacemonkeyBootstrap()







  const health =

    checkSpacemonkeyBootstrapHealth()







  return {


    success:true,


    system:

      "Spacemonkey Bootstrap Orchestrator",


    version:

      "1.0.0",


    lifecycle,


    health,


    status:

      "active",


    createdAt:

      new Date().toISOString()


  }


}







export {

  bootSpacemonkeySystem

}
