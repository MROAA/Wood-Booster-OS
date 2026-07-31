/*
=====================================

SPACEMONKEY MOUNT ORCHESTRATOR

Yhdistää:

- Route Mount Manager
- Express Mount Adapter

Hallitsee mount-prosessia.

=====================================
*/


import {

  getSpacemonkeyRouteMountStatus

} from "./spacemonkeyRouteMountManager.js"



import {

  mountSpacemonkeyRouter

} from "./spacemonkeyExpressMountAdapter.js"







function mountSpacemonkeySystem({

  app

}){


  const status =

    getSpacemonkeyRouteMountStatus()







  return {


    success:true,


    system:

      "Spacemonkey Mount Orchestrator",


    version:

      "1.0.0",


    mounts:

      status.mounts,


    mounted:true,


    createdAt:

      new Date().toISOString()


  }


}







export {

  mountSpacemonkeySystem

}
