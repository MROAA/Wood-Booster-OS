const executionPlanHistory = []



function createExecutionPlan({

  task

}) {


  const plan = {


    taskId:

      task?.id || null,


    target:

      task?.target || null,


    action:

      task?.action || null,


    steps:

    createSteps({

      task

    }),


    status:

      "planned",


    createdAt:

      new Date().toISOString()

  }



  executionPlanHistory.push(

    plan

  )



  return plan

}





function createSteps({

  task

}) {


  if(

    task?.category === "frontend"

  ){

    return [

      {

        order:1,

        action:"inspect_file",

        description:"Lue nykyinen komponentti."

      },


      {

        order:2,

        action:"understand_code",

        description:"Analysoi komponentin rakenne."

      },


      {

        order:3,

        action:"create_proposal",

        description:"Luo turvallinen muutosehdotus."

      },


      {

        order:4,

        action:"validate",

        description:"Tarkista ehdotettu muutos."

      },


      {

        order:5,

        action:"test",

        description:"Varmista toimivuus."

      },


      {

        order:6,

        action:"approval",

        description:"Odota käyttäjän hyväksyntää."

      }

    ]

  }



  return [

    {

      order:1,

      action:"analyze",

      description:"Analysoi tehtävä."

    },


    {

      order:2,

      action:"plan",

      description:"Luo toteutussuunnitelma."

    },


    {

      order:3,

      action:"approval",

      description:"Odota hyväksyntää."

    }

  ]

}





function updateExecutionStatus({

  taskId,

  status

}) {


  const plan =

    executionPlanHistory.find(

      item =>

        item.taskId === taskId

    )



  if(!plan){

    return null

  }



  plan.status = status



  return plan

}





function getExecutionPlans(){


  return [

    ...executionPlanHistory

  ]

}





function getExecutionPlannerStatus(){


  return {


    engine:

      "Spacemonkey Task Execution Planner Engine",


    version:

      "0.1.0",


    plans:

      executionPlanHistory.length

  }

}



export {

  createExecutionPlan,

  updateExecutionStatus,

  getExecutionPlans,

  getExecutionPlannerStatus

}
