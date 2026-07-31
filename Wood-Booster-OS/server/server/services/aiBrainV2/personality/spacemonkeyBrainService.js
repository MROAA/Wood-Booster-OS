import {
  runSpacemonkeyPipeline,
} from "./spacemonkeyCognitivePipeline.js"


import {
  runSpacemonkeyHealthCheck,
} from "./spacemonkeyHealthMonitor.js"


import {
  getSpacemonkeyState,
} from "./spacemonkeyStateManager.js"


import {
  getSpacemonkeyModules,
} from "./spacemonkeyModuleRegistry.js"


import {
  getSpacemonkeyCapabilities,
} from "./spacemonkeyCapabilityRegistry.js"



function createServiceMetadata(){


  return {


    name:
      "Spacemonkey Brain Service",


    version:
      "1.0.0",


    type:
      "intelligence_service",


    createdAt:
      new Date().toISOString()


  }


}



async function process({

  message,

  memory = [],

  knowledge = [],

  systemState = {},

}){


  const result =
    await runSpacemonkeyPipeline({

      message,

      memory,

      knowledge,

      systemState

    })



  return {


    success:
      true,


    service:
      createServiceMetadata(),


    result


  }


}



function getStatus(){


  return {


    service:
      createServiceMetadata(),


    health:
      runSpacemonkeyHealthCheck(),


    state:
      getSpacemonkeyState(),


    modules:
      getSpacemonkeyModules(),


    capabilities:
      getSpacemonkeyCapabilities()


  }


}



function createSystemInterface(){


  return {


    name:
      "Spacemonkey",


    process,


    getStatus


  }


}



const spacemonkeyService =
  createSystemInterface()



export {

  spacemonkeyService,

  process,

  getStatus

}
