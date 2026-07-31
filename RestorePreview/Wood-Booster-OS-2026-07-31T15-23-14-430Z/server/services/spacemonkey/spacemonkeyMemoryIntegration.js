/*
=====================================

SPACEMONKEY MEMORY INTEGRATION V1

Yhdistää:

Spacemonkey Kernel
        |
        v
AI Brain Memory Runtime Adapter
        |
        v
Runtime Context


Vastuut:

- liittää Memory Layer Spacemonkeyhin
- muodostaa turvallisen muistikontextin
- välittää metatiedot


Ei:

- hae tietokantaa
- kirjoita muistia
- tee päätöksiä
- muuta Brain Pipelinea

=====================================
*/


import {
  createMemoryRuntimeContext,
} from "../aiBrainV2/services/memoryRuntimeAdapter.js"



import {
  injectMemoryRuntimeContext,
} from "../aiBrainV2/services/memoryRuntimeInjectionAdapter.js"







function createSpacemonkeyMemoryContext({

  memoryContext = null,

  memories = [],

} = {}) {


  return createMemoryRuntimeContext({

    memoryContext,

    memories,

  })

}







function injectSpacemonkeyMemory({

  runtimeContext = {},

  memoryContext = null,

  memories = [],

} = {}) {


  const memoryRuntimeContext =

    createSpacemonkeyMemoryContext({

      memoryContext,

      memories,

    })





  return injectMemoryRuntimeContext({

    runtimeContext,

    memoryRuntimeContext,

  })

}







function getMemoryIntegrationStatus(){


  return {

    system:
      "Spacemonkey Memory Integration",

    version:
      "1.0.0",

    status:
      "READY",

    adapter:
      "AI Brain V2 Memory Runtime Adapter",

    injection:
      "ACTIVE"

  }

}







export {

  createSpacemonkeyMemoryContext,

  injectSpacemonkeyMemory,

  getMemoryIntegrationStatus,

}
