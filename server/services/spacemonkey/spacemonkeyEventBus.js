/*
=====================================

SPACEMONKEY EVENT BUS V2

MVP COMPATIBILITY VERSION


Vastuut:

- välittää tapahtumia
- tallentaa tapahtumahistorian
- tukee vanhoja moduuleita
- tarjoaa täydellisen event-kontekstin


Ei:

- ei tee AI päätöksiä
- ei käsittele muistia
- ei ohita AI Brainia

=====================================
*/


const listeners = {}

const eventHistory = []







function emitSpacemonkeyEvent({

  event,

  payload = {},

} = {}) {


  if (!event) {

    return {

      success:false,

      error:"event puuttuu"

    }

  }



  const eventRecord = {

    event,

    payload,

    timestamp:

      new Date()
        .toISOString()

  }



  eventHistory.push(
    eventRecord
  )



  const handlers =
    listeners[event] || []



  for (
    const handler
    of handlers
  ) {

    try {

      handler(
        eventRecord
      )

    }

    catch(error) {

      console.error(
        "SPACEMONKEY EVENT ERROR:",
        error
      )

    }

  }



  return {

    success:true,

    event,

    listeners:
      handlers.length

  }

}







function subscribeSpacemonkeyEvent({

  event,

  handler,

} = {}) {


  if (
    !event ||
    typeof handler !== "function"
  ) {

    return false

  }



  if (
    !listeners[event]
  ) {

    listeners[event] = []

  }



  listeners[event].push(
    handler
  )


  return true

}







function unsubscribeSpacemonkeyEvent({

  event,

  handler,

} = {}) {


  if (
    !listeners[event]
  ) {

    return false

  }



  listeners[event] =
    listeners[event]
      .filter(
        item =>
          item !== handler
      )


  return true

}







function getSpacemonkeyEvents(){

  return Object.keys(
    listeners
  )

}







function getEventHistory(){

  return [

    ...eventHistory

  ]

}







function clearSpacemonkeyEvents(){

  Object.keys(
    listeners
  )
  .forEach(
    key =>
      delete listeners[key]
  )


  eventHistory.length = 0

}







/*
=====================================
LEGACY COMPATIBILITY API
=====================================
*/


function emit(
  event,
  payload = {},
){

  return emitSpacemonkeyEvent({

    event,

    payload,

  })

}





function on(
  event,
  handler,
){

  return subscribeSpacemonkeyEvent({

    event,

    handler,

  })

}





function subscribe(
  event,
  handler,
){

  return subscribeSpacemonkeyEvent({

    event,

    handler,

  })

}





export {

  emitSpacemonkeyEvent,

  subscribeSpacemonkeyEvent,

  unsubscribeSpacemonkeyEvent,

  getSpacemonkeyEvents,

  getEventHistory,

  clearSpacemonkeyEvents,


  emit,

  on,

  subscribe,

}
