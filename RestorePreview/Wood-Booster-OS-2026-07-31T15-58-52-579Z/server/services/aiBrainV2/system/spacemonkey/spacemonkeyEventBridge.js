import {
  updateSpacemonkeyRuntime,
} from "./spacemonkeyRuntimeConnector.js"


import {
  updateDashboardActivity,
} from "./spacemonkeyDashboardActivityBridge.js"


import {
  saveSpacemonkeyActivity,
} from "./spacemonkeyActivityStore.js"





const eventHistory = []





const EVENT_TYPES = {

  COGNITION_STARTED:
    "COGNITION_STARTED",


  DECISION_CREATED:
    "DECISION_CREATED",


  PLAN_CREATED:
    "PLAN_CREATED",


  TASK_COMPLETED:
    "TASK_COMPLETED"

}







function createDashboardActivity({

  type,

  data,

} = {}) {


  switch(type){


    case EVENT_TYPES.COGNITION_STARTED:


      return updateDashboardActivity({

        state:
          "thinking",

        action:
          "cognition_started",

        decision:
          null,

        plan:
          null

      })





    case EVENT_TYPES.DECISION_CREATED:


      return updateDashboardActivity({

        state:
          "decision",

        action:
          "decision_created",

        decision:
          data.decision || null,

        plan:
          null

      })





    case EVENT_TYPES.PLAN_CREATED:


      return updateDashboardActivity({

        state:
          "planning",

        action:
          "plan_created",

        decision:
          data.decision || null,

        plan:
          data.plan || null

      })





    case EVENT_TYPES.TASK_COMPLETED:


      return updateDashboardActivity({

        state:
          "completed",

        action:
          "task_completed",

        decision:
          data.decision || null,

        plan:
          data.plan || null

      })





    default:


      return updateDashboardActivity({

        state:
          "idle",

        action:
          "unknown_event"

      })

  }

}







async function emitSpacemonkeyEvent({

  prisma,

  type,

  data = {}

} = {}) {



  let runtimeUpdate = {}





  switch(type){


    case EVENT_TYPES.COGNITION_STARTED:


      runtimeUpdate = {

        status:
          "thinking",

        action:
          "cognition_started",

        decision:
          null,

        plan:
          null

      }


      break





    case EVENT_TYPES.DECISION_CREATED:


      runtimeUpdate = {

        status:
          "decision",

        action:
          "decision_created",

        decision:
          data.decision || null,

        plan:
          null

      }


      break





    case EVENT_TYPES.PLAN_CREATED:


      runtimeUpdate = {

        status:
          "planning",

        action:
          "plan_created",

        decision:
          data.decision || null,

        plan:
          data.plan || null

      }


      break





    case EVENT_TYPES.TASK_COMPLETED:


      runtimeUpdate = {

        status:
          "completed",

        action:
          "task_completed",

        decision:
          data.decision || null,

        plan:
          data.plan || null

      }


      break





    default:


      runtimeUpdate = {

        status:
          "idle",

        action:
          "unknown_event"

      }

  }







  const runtime =

    updateSpacemonkeyRuntime(

      runtimeUpdate

    )





  const dashboardActivity =

    createDashboardActivity({

      type,

      data

    })







  const event = {


    system:

      "Spacemonkey Event Bridge",



    type,



    data,



    runtime,



    dashboardActivity,



    createdAt:

      new Date().toISOString()

  }





  eventHistory.push(

    event

  )





  if(prisma){


    await saveSpacemonkeyActivity({

      prisma,


      type,


      module:
        "spacemonkey",


      status:
        runtime.state.state,


      message:
        type,


      metadata:
        event

    })

  }





  return event

}







function getEventHistory(){


  return [

    ...eventHistory

  ]

}







function getEventBridgeStatus(){


  return {


    engine:

      "Spacemonkey Event Bridge",



    version:

      "1.2.0",



    events:

      eventHistory.length

  }

}







export {

  EVENT_TYPES,

  emitSpacemonkeyEvent,

  getEventHistory,

  getEventBridgeStatus

}
