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
- Decision
- Execution
- Reflection
- Learning
- Evolution
- System Improvement
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



import {

  getSpacemonkeyDecision

} from "./spacemonkeyDecisionAdapter.js"



import {

  getSpacemonkeyExecution

} from "./spacemonkeyExecutionAdapter.js"



import {

  getSpacemonkeyReflection

} from "./spacemonkeyReflectionAdapter.js"



import {

  getSpacemonkeyLearning

} from "./spacemonkeyLearningAdapter.js"



import {

  getSpacemonkeyEvolution

} from "./spacemonkeyEvolutionAdapter.js"



import {

  getSpacemonkeySystemImprovement

} from "./spacemonkeySystemImprovementAdapter.js"







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





    decision:

      getSpacemonkeyDecision(),





    execution:

      getSpacemonkeyExecution(),





    reflection:

      getSpacemonkeyReflection(),





    learning:

      getSpacemonkeyLearning(),





    evolution:

      getSpacemonkeyEvolution(),





    systemImprovement:

      getSpacemonkeySystemImprovement(),





    apis:

      getSpacemonkeyExternalApiCatalog(),





    createdAt:

      new Date().toISOString()


  }


}







export {

  getSpacemonkeyCommandCenter

}