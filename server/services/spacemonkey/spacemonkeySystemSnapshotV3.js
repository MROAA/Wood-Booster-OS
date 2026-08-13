/*
=====================================

SPACEMONKEY SYSTEM SNAPSHOT V3

Yhdistää:

- Manifest
- Kernel Catalog
- Bootstrap Health

Järjestelmätason näkymä.

Read-only.

=====================================
*/


import {

  createSpacemonkeyBootstrapManifest

} from "./spacemonkeyBootstrapManifest.js"



import {

  createKernelCatalog

} from "./spacemonkeyKernelCatalog.js"



import {

  checkSpacemonkeyBootstrapHealth

} from "./spacemonkeyBootstrapHealth.js"







async function createSpacemonkeySystemSnapshotV3(){


  return {


    system:

      "Spacemonkey System Snapshot",


    version:

      "3.0.0",





    manifest:

      createSpacemonkeyBootstrapManifest(),





    kernel:

      await createKernelCatalog(),





    health:

      checkSpacemonkeyBootstrapHealth(),





    status:

      "active",





    createdAt:

      new Date().toISOString()


  }


}







export {

  createSpacemonkeySystemSnapshotV3

}
