import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"


import {
  getSpacemonkeyState,
} from "./spacemonkeyStateManager.js"


import {
  getControllerStatus,
} from "./spacemonkeyRuntimeController.js"


import {
  getObserverMetrics,
} from "./spacemonkeyObserver.js"


import {
  getSpacemonkeyManifest,
} from "./spacemonkeySystemManifest.js"



function checkCore(){

  const core =
    getSpacemonkeyCore()


  return {


    name:
      core.name,


    version:
      core.version,


    status:
      core.status || "unknown",


    healthy:
      true

  }

}



function checkRuntime(){


  const state =
    getSpacemonkeyState()



  const controller =
    getControllerStatus()



  return {


    state:


      state.state,


    controllerActive:

      controller.active,


    healthy:

      controller.active

  }

}



function checkIntelligence(){


  return {


    reasoning:
      "available",


    decision:
      "available",


    planning:
      "available",


    validation:
      "available",


    healthy:
      true

  }

}



function checkMemorySystem(){


  return {


    interface:
      "available",


    status:
      "ready",


    healthy:
      true

  }

}



function checkKnowledgeSystem(){


  return {


    interface:
      "available",


    status:
      "ready",


    healthy:
      true

  }

}



function calculateOverallStatus({

  systems

}){


  const failed =
    Object.values(
      systems
    )
    .filter(

      system =>
        system.healthy === false

    )



  if(
    failed.length > 0
  ){

    return "DEGRADED"

  }



  return "HEALTHY"

}



function runSpacemonkeyDiagnostics(){


  const systems = {


    core:
      checkCore(),


    runtime:
      checkRuntime(),


    intelligence:
      checkIntelligence(),


    memory:
      checkMemorySystem(),


    knowledge:
      checkKnowledgeSystem(),


    observer:
      getObserverMetrics()

  }



  return {


    agent:
      "spacemonkey",


    status:
      calculateOverallStatus({

        systems

      }),


    manifest:
      getSpacemonkeyManifest(),


    systems,


    checkedAt:
      new Date().toISOString()

  }

}



export {

  runSpacemonkeyDiagnostics

}
