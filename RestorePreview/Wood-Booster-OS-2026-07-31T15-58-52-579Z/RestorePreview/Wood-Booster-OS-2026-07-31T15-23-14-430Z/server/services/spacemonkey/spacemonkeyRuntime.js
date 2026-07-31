/*
=====================================

SPACEMONKEY RUNTIME V2

MVP SYSTEM RUNTIME

Yhdistää:

- Public Identity
- Runtime Loader
- Module Capabilities
- Knowledge
- Memory
- Personality
- Security

Ei:

- ei tee AI päätöksiä
- ei kutsu internetiä
- ei muuta AI Brainia
- ei kirjoita muistia

=====================================
*/


import {
  createPublicSpacemonkeyContext,
} from "./public/publicContext.js"


import {
  loadSpacemonkeyRuntime,
} from "./spacemonkeyRuntimeLoader.js"





function normalizeArray(value){

  return Array.isArray(value)
    ? value
    : []

}







function createRuntimeMetadata(){

  return {

    system:
      "Spacemonkey Runtime",

    version:
      "2.0.0",

    mode:
      "mvp",

    createdAt:
      new Date()
        .toISOString()

  }

}







function createSpacemonkeyRuntime({

  personality = null,

  knowledge = [],

  memory = [],

  security = null,

  system = null,

} = {}) {


  const runtimeModules =
    loadSpacemonkeyRuntime()



  return {


    metadata:

      createRuntimeMetadata(),



    identity:

      createPublicSpacemonkeyContext(),



    modules:

      runtimeModules.modules,



    capabilities:

      runtimeModules.capabilities,



    personality,



    knowledge:

      normalizeArray(
        knowledge
      ),



    memory:

      normalizeArray(
        memory
      ),



    security,



    system,



    runtimeStatus:

      "READY"


  }


}







function getRuntimeStatus(runtime){

  return {

    success:
      true,


    status:
      runtime?.runtimeStatus ||
      "UNKNOWN",


    modules:
      runtime?.modules ||
      {},


    capabilities:
      runtime?.capabilities ||
      {},


    timestamp:
      new Date()
        .toISOString()

  }

}







export {

  createSpacemonkeyRuntime,

  getRuntimeStatus

}
