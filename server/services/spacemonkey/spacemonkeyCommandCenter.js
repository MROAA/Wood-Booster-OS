/*
=====================================

SPACEMONKEY COMMAND CENTER

Yhdistetty järjestelmänäkymä.

Tarjoaa:

- Kernel
- Snapshot
- Health
- Capabilities
- Memory
- Knowledge
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



import {

  getSpacemonkeyCapabilities

} from "./spacemonkeyCapabilityAdapter.js"



import {

  getSpacemonkeyMemory

} from "./spacemonkeyMemoryAdapter.js"



import {

  getSpacemonkeyKnowledge

} from "./spacemonkeyKnowledgeAdapter.js"







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





    capabilities:

      getSpacemonkeyCapabilities(),





    memory:

      getSpacemonkeyMemory(),





    knowledge:

      getSpacemonkeyKnowledge(),





    apis:

      getSpacemonkeyExternalApiCatalog(),





    createdAt:

      new Date().toISOString()


  }


}







export {

  getSpacemonkeyCommandCenter

}
