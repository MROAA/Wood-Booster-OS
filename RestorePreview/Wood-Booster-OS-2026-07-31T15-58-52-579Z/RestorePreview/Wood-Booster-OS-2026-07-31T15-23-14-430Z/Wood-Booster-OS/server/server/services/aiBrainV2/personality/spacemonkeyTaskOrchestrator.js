import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const TASK_STATUS = {


  CREATED:
    "created",


  READY:
    "ready",


  RUNNING:
    "running",


  WAITING:
    "waiting",


  COMPLETED:
    "completed",


  FAILED:
    "failed"

}



const tasks = []



function createTask({

  title,

  description,

  goalId = null,

  priority = 5

}) {


  const task = {


    id:
      `task-${Date.now()}`,


    title,


    description,


    goalId,


    priority,


    status:
      TASK_STATUS.CREATED,


    createdAt:
      new Date().toISOString()

  }



  tasks.push(task)



  return task

}



function createTaskSequence({

  goal,

  steps

}) {


  const createdTasks = []



  for(
    const step
    of steps
  ){


    const task =
      createTask({

        title:
          step.title,


        description:
          step.description,


        goalId:
          goal.id,


        priority:
          step.priority || 5

      })



    createdTasks.push(task)

  }



  return {


    goalId:
      goal.id,


    tasks:
      createdTasks

  }


}



function startTask({

  taskId

}) {


  const task =
    tasks.find(

      item =>
        item.id === taskId

    )



  if(
    !task
  ){

    return {

      success:false,

      reason:
        "Task not found"

    }

  }



  task.status =
    TASK_STATUS.RUNNING



  task.startedAt =
    new Date().toISOString()



  return {


    success:true,


    task

  }

}



function completeTask({

  taskId,

  result = null

}) {


  const task =
    tasks.find(

      item =>
        item.id === taskId

    )



  if(
    !task
  ){

    return {

      success:false,

      reason:
        "Task not found"

    }

  }



  task.status =
    TASK_STATUS.COMPLETED



  task.result =
    result



  task.completedAt =
    new Date().toISOString()



  return {


    success:true,


    task

  }

}



function getReadyTasks(){


  return tasks.filter(

    task =>

      task.status === TASK_STATUS.READY

  )

}



function prioritizeTasks(){


  return [

    ...tasks

  ]

  .sort(

    (a,b)=>

      b.priority -
      a.priority

  )

}



function getTaskStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    totalTasks:
      tasks.length,


    tasks

  }

}



export {

  TASK_STATUS,

  createTask,

  createTaskSequence,

  startTask,

  completeTask,

  getReadyTasks,

  prioritizeTasks,

  getTaskStatus

}
