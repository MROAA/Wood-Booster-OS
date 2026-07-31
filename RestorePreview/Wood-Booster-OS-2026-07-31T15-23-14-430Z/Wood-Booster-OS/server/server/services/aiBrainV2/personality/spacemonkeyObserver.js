import {
  SPACEMONKEY_EVENTS,
  subscribe,
} from "./spacemonkeyEventBus.js"



const observationHistory = []



const observerMetrics = {


  totalEvents:
    0,


  errors:
    0,


  tasksObserved:
    0,


  startedAt:
    new Date().toISOString()


}



function recordObservation({

  event,

  payload,

}) {


  const observation = {


    event,


    payload,


    timestamp:
      new Date().toISOString()


  }



  observationHistory.push(
    observation
  )



  observerMetrics.totalEvents++



  if(
    event === SPACEMONKEY_EVENTS.ERROR
  ){

    observerMetrics.errors++

  }



  if(
    event === SPACEMONKEY_EVENTS.CONTEXT_CREATED
  ){

    observerMetrics.tasksObserved++

  }



  return observation

}



function initializeObserver(){


  Object.values(
    SPACEMONKEY_EVENTS
  )
  .forEach(

    event => {


      subscribe(

        event,

        recordObservation

      )


    }

  )



  return {


    status:
      "active",


    startedAt:
      new Date().toISOString()

  }


}



function getObservationHistory(){


  return [

    ...observationHistory

  ]

}



function getObserverMetrics(){


  return {


    ...observerMetrics,


    lastEvent:

      observationHistory.length > 0

        ?

        observationHistory[
          observationHistory.length - 1
        ]

        :

        null


  }

}



function clearObservationHistory(){


  observationHistory.length = 0



  observerMetrics.totalEvents = 0


}



export {

  initializeObserver,

  getObservationHistory,

  getObserverMetrics,

  clearObservationHistory

}
