import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



import {
  understandIntent,
} from "./spacemonkeyIntentUnderstandingEngine.js"



import {
  selectRelevantContext,
} from "./spacemonkeyContextIntelligenceEngine.js"



import {
  makeDecision,
} from "./spacemonkeyDecisionEngine.js"



import {
  createPlan,
} from "./spacemonkeyPlanningEngine.js"



import {
  createExecutionQueue,
} from "./spacemonkeyTaskExecutionBridge.js"



import {
  reflectOnExecution,
} from "./spacemonkeyReflectionOrchestrator.js"



const cycleHistory = []



const CYCLE_STATUS = {


  STARTED:
    "started",


  THINKING:
    "thinking",


  PLANNING:
    "planning",


  EXECUTING:
    "executing",


  REFLECTING:
    "reflecting",


  COMPLETED:
    "completed"

}



async function runAutonomousCycle({

  message,

  memory = [],

  knowledge = [],

  goals = [],

  state = {}

}) {


  const core =
    getSpacemonkeyCore()



  const cycle = {


    id:
      `cycle-${Date.now()}`,


    status:
      CYCLE_STATUS.STARTED,


    message,


    coreVersion:
      core.version,


    startedAt:
      new Date().toISOString()

  }



  /*
    1. Understand Intent
  */


  cycle.status =
    CYCLE_STATUS.THINKING



  const intent =
    understandIntent({

      message

    })



  /*
    2. Build Context
  */


  const context =
    selectRelevantContext({

      query:
        message,


      memory,

      knowledge,

      goals,

      state

    })



  /*
    3. Make Decision
  */


  const decision =
    makeDecision({

      situation:
        message,


      options:

      [

        {

          name:
            "Proceed with structured solution",


          missionAlignment:
            0.9,


          benefit:
            0.8,


          feasibility:
            0.8,


          risk:
            0.2

        },

        {

          name:
            "Request more information",


          missionAlignment:
            0.5,


          benefit:
            0.4,


          feasibility:
            0.9,


          risk:
            0.1

        }

      ]

    })



  /*
    4. Create Plan
  */


  cycle.status =
    CYCLE_STATUS.PLANNING



  const plan =
    createPlan({

      decision,

      objective:
        decision.decision.selected.option.name

    })



  /*
    5. Create Execution Queue
  */


  const queue =
    createExecutionQueue({

      plan

    })



  /*
    6. Reflection Preparation
  */


  cycle.status =
    CYCLE_STATUS.REFLECTING



  const reflection =
    reflectOnExecution({

      execution:

      {

        status:
          "completed",


        queueId:
          queue.id

      }

    })



  cycle.status =
    CYCLE_STATUS.COMPLETED



  cycle.completedAt =
    new Date().toISOString()



  const result = {


    cycle,


    intent,


    context,


    decision,


    plan,


    queue,


    reflection

  }



  cycleHistory.push(

    result

  )



  return result

}



function getCycleHistory(){


  return [

    ...cycleHistory

  ]

}



function getCycleStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    cycles:
      cycleHistory.length,


    history:
      cycleHistory

  }

}



export {

  CYCLE_STATUS,

  runAutonomousCycle,

  getCycleHistory,

  getCycleStatus

}
