const MODULE_ID = "creator-intelligence-event-bus"



const subscribers = {}

const eventHistory = []



function subscribe({

  event,

  module,

  handler,

}){

  if (
    !subscribers[event]
  ){

    subscribers[event] = []

  }


  subscribers[event].push({

    module,

    handler,

  })


  return {

    success:
      true,

    event,

    module,

  }

}



function publish({

  event,

  payload,

}){

  const eventRecord = {

    id:
      `creator-event-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    event,

    payload,

  }


  eventHistory.push(
    eventRecord
  )



  const listeners =
    subscribers[event] || []



  const results =
    listeners.map(
      listener => {

        try {

          return {

            module:
              listener.module,

            status:
              "processed",

            result:
              listener.handler(
                payload
              ),

          }

        }

        catch(error){

          return {

            module:
              listener.module,

            status:
              "failed",

            error:
              error.message,

          }

        }

      }
    )



  return {

    event:
      eventRecord,

    listeners:
      results.length,

    results,

  }

}



function getSubscribers(){

  return {

    moduleId:
      MODULE_ID,

    subscribers,

  }

}



function getEventHistory(){

  return {

    moduleId:
      MODULE_ID,

    count:
      eventHistory.length,

    events:
      eventHistory,

  }

}



function getLatestEvents(){

  return eventHistory.slice(-10)

}



export {

  MODULE_ID,

  subscribe,

  publish,

  getSubscribers,

  getEventHistory,

  getLatestEvents,

}
