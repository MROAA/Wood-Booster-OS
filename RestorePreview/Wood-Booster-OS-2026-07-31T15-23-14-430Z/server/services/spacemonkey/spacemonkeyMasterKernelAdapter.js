/*
=====================================

SPACEMONKEY MASTER KERNEL ADAPTER

Ylin lukuväylä
Spacemonkey OS Kernelille.

Yhdistää:

- Bootstrap
- Command Center
- Kernel
- Snapshot
- Health
- External API

Read-only.

=====================================
*/


import {

  getSpacemonkeyBootstrap

} from "./spacemonkeyBootstrapAdapter.js"



import {

  getSpacemonkeyDashboard

} from "./spacemonkeyCommandCenterAdapter.js"



import {

  getSpacemonkeyKernel

} from "./spacemonkeyKernelAdapter.js"



import {

  getSpacemonkeySnapshotV3

} from "./spacemonkeySnapshotAdapterV3.js"



import {

  checkSpacemonkeyBootstrapHealth

} from "./spacemonkeyBootstrapHealth.js"



import {

  getSpacemonkeyExternalApiCatalog

} from "./spacemonkeyExternalApiCatalogAdapter.js"







function getSpacemonkeyOS(){


  return {


    success:true,


    system:

      "Spacemonkey OS API",


    version:

      "1.0.0",


    status:

      "active",


    bootstrap:

      getSpacemonkeyBootstrap(),


    commandCenter:

      getSpacemonkeyDashboard(),


    kernel:

      getSpacemonkeyKernel(),


    snapshot:

      getSpacemonkeySnapshotV3(),


    health:

      checkSpacemonkeyBootstrapHealth(),


    apis:

      getSpacemonkeyExternalApiCatalog(),


    createdAt:

      new Date().toISOString()


  }


}







export {

  getSpacemonkeyOS

}
