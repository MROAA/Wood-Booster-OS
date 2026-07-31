import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const PLAN_STATUS = {


  CREATED:
    "created",


  READY:
    "ready",


  ACTIVE:
    "active",


  COMPLETED:
    "completed",


  FAILED:
    "failed"

}



const planningHistory = []



function createPlanStep({

  title,

  description,

  order

}) {


  return {


    id:
      `step-${Date.now()}-${order}`,


    title,


    description,


    order,


    status:
      "pending"

  }

}



function generateSteps({

  objective

}) {


  const baseSteps = [

    {

      title:
        "Understand situation",


      description:
        "Analyze current context and requirements."

    },


    {

      title:
        "Prepare solution",


      description:
        "Design a suitable approach."

    },


    {

      title:
        "Execute implementation",


      description:
        "Perform approved actions."

    },


    {

      title:
        "Validate result",


      description:
        "Check quality and correctness."

    },


    {

      title:
        "Reflect and learn",


      description:
        "Capture improvements for future."

    }

  ]



  return baseSteps.map(

    (step,index)=>

      createPlanStep({

        title:
          step.title,


        description:
          step.description,


        order:
          index + 1

      })

  )

}



function createPlan({

  decision,

  objective

}) {


  const core =
    getSpacemonkeyCore()



  const plan = {


    id:
      `plan-${Date.now()}`,


    decision,


    objective,


    steps:

      generateSteps({

        objective

      }),


    status:
      PLAN_STATUS.CREATED,


    coreVersion:
      core.version,


    createdAt:
      new Date().toISOString()

  }



  planningHistory.push(

    plan

  )



  return plan

}



function activatePlan({

  planId

}) {


  const plan =
    planningHistory.find(

      item =>
        item.id === planId

    )



  if(
    !plan
  ){

    return {


      success:false,


      reason:
        "Plan not found"

    }

  }



  plan.status =
    PLAN_STATUS.ACTIVE



  plan.startedAt =
    new Date().toISOString()



  return {


    success:true,


    plan

  }

}



function completePlan({

  planId

}) {


  const plan =
    planningHistory.find(

      item =>
        item.id === planId

    )



  if(
    !plan
  ){

    return {


      success:false,


      reason:
        "Plan not found"

    }

  }



  plan.status =
    PLAN_STATUS.COMPLETED



  plan.completedAt =
    new Date().toISOString()



  return {


    success:true,


    plan

  }

}



function getPlanningHistory(){


  return [

    ...planningHistory

  ]

}



function getPlanningStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    plans:
      planningHistory.length,


    history:
      planningHistory

  }

}



export {

  PLAN_STATUS,

  createPlan,

  activatePlan,

  completePlan,

  getPlanningHistory,

  getPlanningStatus

}
