const eventListeners = {}



const SPACEMONKEY_EVENTS = {


  CORE_INITIALIZED:
    "core_initialized",


  CONTEXT_CREATED:
    "context_created",


  REASONING_STARTED:
    "reasoning_started",


  REASONING_COMPLETED:
    "reasoning_completed",


  DECISION_CREATED:
    "decision_created",


  PLAN_CREATED:
    "plan_created",


  EXECUTION_STARTED:
    "execution_started",


  EXECUTION_COMPLETED:
    "execution_completed",


  REFLECTION_STARTED:
    "reflection_started",


  LEARNING_CREATED:
    "learning_created",


  ERROR:
    "error"

}



function subscribe(

  event,

  callback

){


  if(
    !eventListeners[event]
  ){

    eventListeners[event] = []

  }



  eventListeners[event].push(
    callback
  )


}



function emit({

  event,

  payload = {}

}){


  const listeners =
    eventListeners[event] || []



  const eventData = {


    event,


    payload,


    timestamp:
      new Date().toISOString()


  }



  for(
    const listener
    of listeners
  ){

    try {


      listener(
        eventData
      )


    }

    catch(error){


      console.error(

        "Spacemonkey event listener error:",

        error.message

      )


    }

  }



  return eventData

}



function getRegisteredEvents(){


  return Object.keys(
    eventListeners
  )

}



function clearEventListeners(){


  Object.keys(
    eventListeners
  )
  .forEach(

    event => {

      delete eventListeners[event]

    }

  )


}



export {

  SPACEMONKEY_EVENTS,

  subscribe,

  emit,

  getRegisteredEvents,

  clearEventListeners

}
