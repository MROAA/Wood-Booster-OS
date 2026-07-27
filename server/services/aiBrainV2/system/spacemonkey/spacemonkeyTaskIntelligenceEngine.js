const taskHistory = []



function createTask({

  message,

  codingContext,

  codeChangePlan

}) {


  const task = {


    id:

      `task-${Date.now()}`,


    title:

      createTitle({

        message,

        codingContext

      }),


    category:

      detectCategory({

        codingContext

      }),


    target:

      codingContext?.filePath || null,


    action:

      codeChangePlan?.action || "unknown",


    priority:

      calculatePriority({

        action:

          codeChangePlan?.action

      }),


    status:

      "planned",


    dependencies:

      createDependencies({

        codingContext

      }),


    createdAt:

      new Date().toISOString()

  }



  taskHistory.push(

    task

  )



  return task

}





function createTitle({

  message,

  codingContext

}) {


  if(

    codingContext?.target

  ){

    return `${codingContext.action} ${codingContext.target}`

  }



  return message || "Unnamed task"

}





function detectCategory({

  codingContext

}) {


  if(

    !codingContext

  ){

    return "general"

  }



  const path =

    codingContext.filePath || ""



  if(

    path.includes("src/")

  ){

    return "frontend"

  }



  if(

    path.includes("server/")

  ){

    return "backend"

  }



  return "development"

}





function calculatePriority({

  action

}) {


  if(

    action === "create"

  ){

    return "high"

  }



  if(

    action === "update"

  ){

    return "medium"

  }



  return "low"

}





function createDependencies({

  codingContext

}) {


  if(

    !codingContext?.filePath

  ){

    return []

  }



  return [

    codingContext.filePath

  ]

}





function updateTaskStatus({

  taskId,

  status

}) {


  const task =

    taskHistory.find(

      item =>

        item.id === taskId

    )



  if(!task){

    return null

  }



  task.status = status



  return task

}





function getTasks(){


  return [

    ...taskHistory

  ]

}





function getTaskStatus(){


  return {


    engine:

      "Spacemonkey Task Intelligence Engine",


    version:

      "0.1.0",


    tasks:

      taskHistory.length

  }

}



export {

  createTask,

  updateTaskStatus,

  getTasks,

  getTaskStatus

}
