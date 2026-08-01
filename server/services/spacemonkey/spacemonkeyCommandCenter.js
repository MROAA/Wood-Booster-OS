/*
=====================================

SPACEMONKEY COMMAND CENTER

Yhdistetty järjestelmänäkymä.

Tarjoaa:

- Kernel
- Snapshot
- Health
- External APIs

Read-only.

=====================================
*/


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







async function getSpacemonkeyCommandCenter(){


  return {


    success:true,


    system:

      "Spacemonkey Command Center",


    version:

      "1.0.0",





    kernel:

      await getSpacemonkeyKernel(),





    snapshot:

      await getSpacemonkeySnapshotV3(),





    health:

      checkSpacemonkeyBootstrapHealth(),





    apis:

      getSpacemonkeyExternalApiCatalog(),





    createdAt:

      new Date().toISOString()


  }


}







export {

  getSpacemonkeyCommandCenter

}
