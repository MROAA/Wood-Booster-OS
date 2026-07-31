import {
  getSpacemonkeyManifest,
} from "./spacemonkeySystemManifest.js"


import {
  runSpacemonkeyHealthCheck,
} from "./spacemonkeyHealthMonitor.js"


import {
  getSpacemonkeyModules,
} from "./spacemonkeyModuleRegistry.js"


import {
  getSpacemonkeyCapabilities,
} from "./spacemonkeyCapabilityRegistry.js"


import {
  setSpacemonkeyState,

  SPACEMONKEY_STATES

} from "./spacemonkeyStateManager.js"


import {
  emit,

  SPACEMONKEY_EVENTS

} from "./spacemonkeyEventBus.js"



const BOOT_VERSION =
  "1.0.0"



function validateManifest(){

  const manifest =
    getSpacemonkeyManifest()


  return {


    valid:
      Boolean(
        manifest.identity
      ),


    manifest

  }

}



function loadModules(){

  const modules =
    getSpacemonkeyModules()


  return {


    loaded:
      modules.length,


    modules

  }

}



function loadCapabilities(){

  const capabilities =
    getSpacemonkeyCapabilities()


  return {


    available:
      capabilities.length,


    capabilities

  }

}



function performSelfTest(){


  const health =
    runSpacemonkeyHealthCheck()



  return {


    passed:
      health.status === "READY",


    health

  }

}



async function bootSpacemonkey(){


  setSpacemonkeyState({

    state:
      SPACEMONKEY_STATES.UNDERSTANDING,

    activity:
      "Starting boot sequence"

  })



  emit({

    event:
      SPACEMONKEY_EVENTS.CORE_INITIALIZED,

    payload:

    {

      message:
        "Spacemonkey boot started"

    }

  })



  const identity =
    validateManifest()



  if(!identity.valid){


    setSpacemonkeyState({

      state:
        SPACEMONKEY_STATES.SAFE_MODE,

      activity:
        "Manifest validation failed"

    })


    return {


      success:false,


      status:
        "SAFE_MODE",


      reason:
        "Invalid manifest"

    }

  }



  const modules =
    loadModules()



  const capabilities =
    loadCapabilities()



  const selfTest =
    performSelfTest()



  if(
    !selfTest.passed
  ){


    setSpacemonkeyState({

      state:
        SPACEMONKEY_STATES.SAFE_MODE,

      activity:
        "Self test failed"

    })


    return {


      success:false,


      status:
        "SAFE_MODE",


      health:
        selfTest.health

    }

  }



  setSpacemonkeyState({

    state:
      SPACEMONKEY_STATES.IDLE,

    activity:
      "Waiting for instructions"

  })



  return {


    success:true,


    status:
      "READY",


    bootVersion:
      BOOT_VERSION,


    identity:
      identity.manifest.identity,


    modules,


    capabilities,


    health:
      selfTest.health,


    startedAt:
      new Date().toISOString()

  }


}



export {

  bootSpacemonkey,

  BOOT_VERSION

}
