/*
=====================================

SPACEMONKEY LEARNING EVENT BRIDGE V3


Yhdistää:

- Spacemonkey Event Bus
- Learning Integration
- Learning Pipeline


Vastuut:

- kuuntelee tapahtumia
- normalisoi tapahtumamuodon
- välittää oppimisputkeen
- ylläpitää debug-tilaa


Ei:

- ei kirjoita tietokantaan
- ei hyväksy oppimista
- ei kutsu LLM:ää


=====================================
*/


import {
  subscribeSpacemonkeyEvent,
} from "./spacemonkeyEventBus.js"



import {
  processSpacemonkeyLearningEvent,
} from "./spacemonkeyLearningIntegration.js"







let started = false

let listeners = []

let eventsProcessed = 0

let lastEvent = null

let lastResult = null







function normalizeEvent(event = {}){


  const nestedEvent =
    event.payload || {}



  return {


    name:

      event.name ||

      event.event ||

      nestedEvent.event ||

      "UNKNOWN_EVENT",



    payload:

      nestedEvent.payload ||

      event.payload ||

      {},



    timestamp:

      event.timestamp ||

      new Date()
        .toISOString()


  }


}







function handleLearningEvent(
  event = {},
){


  const normalized =

    normalizeEvent(
      event
    )



  const result =

    processSpacemonkeyLearningEvent({

      name:
        normalized.name,


      payload:
        normalized.payload,


      source:
        "spacemonkey-event-bridge",

    })



  eventsProcessed++



  lastEvent = {

    name:
      normalized.name,


    timestamp:
      normalized.timestamp,

  }



  lastResult = result



  return result

}







function startSpacemonkeyLearningEventBridge(){


  if(started){

    return {

      success:true,

      status:"already_started",

    }

  }



  started = true



  listeners = [


    subscribeSpacemonkeyEvent({

      event:"SYSTEM_ONLINE",

      handler:handleLearningEvent,

    }),



    subscribeSpacemonkeyEvent({

      event:"COMMAND_EXECUTED",

      handler:handleLearningEvent,

    }),



    subscribeSpacemonkeyEvent({

      event:"SNAPSHOT_CREATED",

      handler:handleLearningEvent,

    }),


  ]



  return {

    success:true,

    status:"started",

    listeners:
      listeners.length,

  }

}







function stopSpacemonkeyLearningEventBridge(){


  started = false

  listeners = []



  return {

    success:true,

    status:"stopped",

  }

}







function getSpacemonkeyLearningEventBridgeStatus(){


  return {

    system:
      "Spacemonkey Learning Event Bridge",


    version:
      "3.0.0",


    started,


    listeners:
      listeners.length,


    eventsProcessed,


    lastEvent,


    lastResult,


    status:
      started
        ? "ACTIVE"
        : "READY",

  }

}







export {

  startSpacemonkeyLearningEventBridge,

  stopSpacemonkeyLearningEventBridge,

  getSpacemonkeyLearningEventBridgeStatus,

}
