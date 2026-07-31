import {
  runSpacemonkeyPipeline,
} from "./spacemonkeyCognitivePipeline.js"


import {
  setSpacemonkeyState,

  getSpacemonkeyState,

  SPACEMONKEY_STATES

} from "./spacemonkeyStateManager.js"


import {
  emit,

  SPACEMONKEY_EVENTS

} from "./spacemonkeyEventBus.js"



let controllerStatus = {

  active:
    false,

  startedAt:
    null

}



function startController(){


  controllerStatus = {


    active:
      true,


    startedAt:
      new Date().toISOString()

  }



  emit({

    event:
      SPACEMONKEY_EVENTS.CORE_INITIALIZED,

    payload:

    {

      message:
        "Runtime controller started"

    }

  })



  return controllerStatus

}



function stopController(){


  controllerStatus = {


    active:
      false,


    stoppedAt:
      new Date().toISOString()

  }



  return controllerStatus

}



async function processTask({

  message,

  memory = [],

  knowledge = [],

  systemState = {}

}){


  if(
    !controllerStatus.active
  ){

    throw new Error(

      "Spacemonkey controller is not active"

    )

  }



  setSpacemonkeyState({

    state:
      SPACEMONKEY_STATES.UNDERSTANDING,

    activity:
      "Processing incoming request"

  })



  emit({

    event:
      SPACEMONKEY_EVENTS.CONTEXT_CREATED,

    payload:

    {

      message

    }

  })



  const result =
    await runSpacemonkeyPipeline({

      message,

      memory,

      knowledge,

      systemState

    })



  setSpacemonkeyState({

    state:
      SPACEMONKEY_STATES.IDLE,

    activity:
      "Waiting for next request"

  })



  return {


    success:
      true,


    controller:
      "spacemonkey-runtime-controller",


    result,


    state:
      getSpacemonkeyState(),


    completedAt:
      new Date().toISOString()

  }


}



function getControllerStatus(){


  return {


    ...controllerStatus,


    state:
      getSpacemonkeyState()

  }


}



export {

  startController,

  stopController,

  processTask,

  getControllerStatus

}
