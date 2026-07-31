const MODULE_ID = "creator-intelligence-execution-planner"



const plans = []



function createExecutionPlan({

  strategyId,

  objective,

  tasks,

  dependencies,

  tools,

  validationPoints,

}){

  const plan = {

    id:
      `execution-plan-${Date.now()}`,


    created:
      new Date().toISOString(),


    strategyId,


    objective,


    tasks:
      tasks || [],


    dependencies:
      dependencies || [],


    tools:
      tools || [],


    validationPoints:
      validationPoints || [],


    status:
      "planned",

  }



  plans.push(plan)


  return plan

}



function addTask({

  planId,

  task,

}){

  const plan =
    plans.find(
      item =>
        item.id === planId
    )


  if (!plan){

    return {

      success:
        false,

      reason:
        "Plan not found.",

    }

  }



  plan.tasks.push({

    id:
      `task-${Date.now()}`,

    name:
      task,

    status:
      "pending",

  })



  return plan

}



function updatePlanStatus({

  id,

  status,

}){

  const plan =
    plans.find(
      item =>
        item.id === id
    )


  if (!plan){

    return {

      success:
        false,

    }

  }



  plan.status =
    status


  plan.updated =
    new Date().toISOString()



  return {

    success:
      true,

    plan,

  }

}



function getPlans(){

  return {

    moduleId:
      MODULE_ID,

    count:
      plans.length,

    plans,

  }

}



function getActivePlans(){

  return plans.filter(
    plan =>
      plan.status !== "completed"
  )

}



export {

  MODULE_ID,

  createExecutionPlan,

  addTask,

  updatePlanStatus,

  getPlans,

  getActivePlans,

}
