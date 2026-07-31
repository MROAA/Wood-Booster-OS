const planningHistory = []



const PLAN_STATUS = {


  CREATED:
    "created",


  ACTIVE:
    "active",


  COMPLETED:
    "completed",


  BLOCKED:
    "blocked"

}



function createStep({

  title,

  description,

  order,

  risk = "low"

}) {


  return {


    id:
      `step-${Date.now()}-${order}`,


    title,


    description,


    order,


    risk,


    completed:
      false

  }

}



function createPlan({

  goal,

  decision,

  steps = []

}) {


  const plan = {


    id:
      `plan-${Date.now()}`,


    goal,


    decision,


    steps,


    status:
      PLAN_STATUS.CREATED,


    createdAt:
      new Date().toISOString()

  }



  planningHistory.push(

    plan

  )



  return plan

}



function buildMVPPlan({

  goal,

  decision

}) {


  const steps = [


    createStep({

      title:
        "Ymmärrä nykytila",


      description:
        "Tutki olemassa oleva rakenne ennen muutoksia.",


      order:
        1

    }),


    createStep({

      title:
        "Suunnittele ratkaisu",


      description:
        "Määritä pienin toimiva toteutus.",


      order:
        2

    }),


    createStep({

      title:
        "Toteuta MVP",


      description:
        "Rakenna yksi toimiva osa kerrallaan.",


      order:
        3

    }),


    createStep({

      title:
        "Testaa tulos",


      description:
        "Varmista toimivuus ennen seuraavaa vaihetta.",


      order:
        4

    })

  ]



  return createPlan({

    goal,

    decision,

    steps

  })

}



function completeStep({

  planId,

  stepId

}) {


  const plan =

    planningHistory.find(

      item =>

        item.id === planId

    )



  if(!plan){

    return null

  }



  const step =

    plan.steps.find(

      item =>

        item.id === stepId

    )



  if(!step){

    return null

  }



  step.completed = true



  return step

}



function getPlanningHistory(){

  return [

    ...planningHistory

  ]

}



function getPlanningStatus(){

  return {


    engine:
      "Spacemonkey Planning Engine",


    version:
      "0.1.0",


    plans:
      planningHistory.length

  }

}



export {

  PLAN_STATUS,

  createPlan,

  buildMVPPlan,

  completeStep,

  getPlanningHistory,

  getPlanningStatus

}
