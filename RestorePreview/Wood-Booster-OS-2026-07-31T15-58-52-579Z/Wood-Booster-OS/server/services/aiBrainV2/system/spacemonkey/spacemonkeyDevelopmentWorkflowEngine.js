const workflowHistory = []



function createWorkflow({

  task,

  executionPlan

}) {


  const workflow = {


    id:

      `workflow-${Date.now()}`,


    taskId:

      task?.id || null,


    target:

      task?.target || null,


    status:

      "active",


    steps:

      normalizeSteps(

        executionPlan?.steps

      ),


    currentStep:

      0,


    createdAt:

      new Date().toISOString(),


    updatedAt:

      new Date().toISOString()

  }



  workflowHistory.push(

    workflow

  )



  return workflow

}





function completeCurrentStep({

  workflowId

}) {


  const workflow =

    findWorkflow(workflowId)



  if(!workflow){

    return null

  }



  const step =

    workflow.steps[

      workflow.currentStep

    ]



  if(step){

    step.status =

      "completed"

  }



  workflow.currentStep++



  if(

    workflow.currentStep >=

    workflow.steps.length

  ){

    workflow.status =

      "completed"

  }



  workflow.updatedAt =

    new Date().toISOString()



  return workflow

}





function setWorkflowStatus({

  workflowId,

  status

}) {


  const workflow =

    findWorkflow(workflowId)



  if(!workflow){

    return null

  }



  workflow.status = status



  workflow.updatedAt =

    new Date().toISOString()



  return workflow

}





function findWorkflow(id){


  return workflowHistory.find(

    item =>

      item.id === id

  )

}





function normalizeSteps(steps){


  if(!Array.isArray(steps)){

    return []

  }



  return steps.map(

    step =>

    ({

      ...step,


      status:

        "pending"

    })

  )

}





function getActiveWorkflows(){


  return workflowHistory.filter(

    workflow =>

      workflow.status === "active"

  )

}





function getWorkflowHistory(){


  return [

    ...workflowHistory

  ]

}





function getDevelopmentWorkflowStatus(){


  return {


    engine:

      "Spacemonkey Development Workflow Engine",


    version:

      "0.1.0",


    workflows:

      workflowHistory.length

  }

}



export {

  createWorkflow,

  completeCurrentStep,

  setWorkflowStatus,

  getActiveWorkflows,

  getWorkflowHistory,

  getDevelopmentWorkflowStatus

}
