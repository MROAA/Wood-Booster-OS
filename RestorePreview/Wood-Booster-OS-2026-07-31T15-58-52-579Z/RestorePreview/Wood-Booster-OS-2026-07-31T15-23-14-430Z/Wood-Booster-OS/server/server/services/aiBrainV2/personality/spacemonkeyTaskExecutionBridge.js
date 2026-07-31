import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



import {
  createTask,
} from "./spacemonkeyTaskOrchestrator.js"



const bridgeHistory = []



const BRIDGE_STATUS = {


  CREATED:
    "created",


  QUEUED:
    "queued",


  EXECUTING:
    "executing",


  COMPLETED:
    "completed",


  FAILED:
    "failed"

}



function convertStepToTask({

  step,

  planId

}) {


  return createTask({

    title:
      step.title,


    description:
      step.description,


    goalId:
      planId,


    priority:
      5

  })

}



function generateTasksFromPlan({

  plan

}) {


  const tasks = []



  for(
    const step
    of plan.steps
  ){


    const task =
      convertStepToTask({

        step,

        planId:
          plan.id

      })



    tasks.push(task)

  }



  return tasks

}



function createExecutionQueue({

  plan

}) {


  const tasks =
    generateTasksFromPlan({

      plan

    })



  const queue = {


    id:
      `queue-${Date.now()}`,


    planId:
      plan.id,


    tasks,


    status:
      BRIDGE_STATUS.QUEUED,


    createdAt:
      new Date().toISOString()

  }



  bridgeHistory.push(
    queue
  )



  return queue

}



function getNextTask({

  queue

}) {


  return queue.tasks.find(

    task =>

      task.status === "created"

  )

}



function markQueueCompleted({

  queue

}) {


  queue.status =
    BRIDGE_STATUS.COMPLETED



  queue.completedAt =
    new Date().toISOString()



  return queue

}



function getBridgeStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    queues:
      bridgeHistory.length,


    history:
      bridgeHistory

  }

}



export {

  BRIDGE_STATUS,

  createExecutionQueue,

  getNextTask,

  markQueueCompleted,

  getBridgeStatus

}
