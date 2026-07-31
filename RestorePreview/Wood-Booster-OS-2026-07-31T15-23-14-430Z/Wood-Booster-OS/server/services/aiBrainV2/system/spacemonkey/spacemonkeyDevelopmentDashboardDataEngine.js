import {
  makeDecision,
} from "./spacemonkeyDecisionEngine.js"


import {
  buildMVPPlan,
} from "./spacemonkeyPlanningEngine.js"



const dashboardHistory = []





function createDashboardData({

  systemState,

  tasks,

  workflows,

  audits,

  reflections,

  improvements,

  activity,

  decisionOptions = [],

  goal = null

}) {


  const resolvedState =

    systemState ||

    createDefaultSystemState()



  const recentActivity =

    normalize(activity)



  const currentTask =

    buildCurrentTask(
      recentActivity
    )



  const proposal =

    buildProposal(
      recentActivity
    )



  const decision =

    createDecision(
      decisionOptions
    )



  const planning =

    createPlanning({

      goal,

      decision

    })





  const dashboard = {


    system: {

      name:

        "Spacemonkey",

      status:

        resolvedState.status

    },



    modules:

      resolvedState.modules,



    development: {

      currentTask,


      proposal,


      tasks:

        normalize(tasks),


      workflows:

        normalize(workflows),


      audits:

        normalize(audits)

    },



    learning: {

      reflections:

        normalize(reflections),


      improvements:

        normalize(improvements)

    },



    decision,



    planning,



    activity:

      recentActivity,



    statistics: {

      tasks:

        count(tasks),


      workflows:

        count(workflows),


      audits:

        count(audits),


      reflections:

        count(reflections),


      improvements:

        count(improvements),


      activity:

        count(activity)

    },



    createdAt:

      new Date().toISOString()

  }





  dashboardHistory.push(
    dashboard
  )



  return dashboard

}







function createDecision(options){


  if(

    !Array.isArray(options) ||

    options.length === 0

  ){

    return {

      status:

        "needs_information",


      recommendation:

        "Spacemonkey odottaa lisää tietoa.",


      reasoning:

        [

          "Ei arvioitavia vaihtoehtoja."

        ]

    }

  }





  return makeDecision({

    options

  })

}







function createPlanning({

  goal,

  decision

}){


  if(

    !goal ||

    !decision?.selected

  ){

    return {

      status:

        "waiting",


      nextStep:

        "Odottaa tehtävää",


      reason:

        "Spacemonkey tarvitsee projektin tai tavoitteen."

    }

  }





  const plan =

    buildMVPPlan({

      goal,

      decision:

        decision.selected

    })





  return {

    id:

      plan.id,


    status:

      plan.status,


    goal:

      plan.goal,


    nextStep:

      plan.steps?.[0]?.title ||


      "Ei seuraavaa askelta",


    reason:

      plan.steps?.[0]?.description ||


      "Suunnitelma luotu.",


    steps:

      plan.steps

  }

}







function buildCurrentTask(activity){

  if(

    !Array.isArray(activity) ||

    activity.length === 0

  ){

    return {

      status:

        "idle",

      file:

        null,

      quality:

        null,

      release:

        null,

      lastModule:

        null,

      lastMessage:

        null

    }

  }



  const latestActivity =

    activity[0]



  return {

    status:

      latestActivity.status,


    file:

      extractFileFromActivity(
        activity.find(
          item =>
            item.type === "write_completed"
        )
      ),


    quality:

      activity.find(
        item =>
          item.type === "code_quality_evaluated"
      )?.message || null,


    release:

      activity.find(
        item =>
          item.type === "release_gate_evaluated"
      )?.status || null,


    lastModule:

      latestActivity.module,


    lastMessage:

      latestActivity.message

  }

}







function extractFileFromActivity(activity){

  if(!activity){

    return null

  }


  if(activity.metadata){

    try{

      const data =
        JSON.parse(
          activity.metadata
        )


      return data.filePath || null

    }

    catch(error){

      return null

    }

  }


  return null

}







function buildProposal(){

  return null

}







function createDefaultSystemState(){

  return {

    status:

      "operational",

    modules:

    [

      {

        name:

          "Spacemonkey Core",

        status:

          "active"

      },


      {

        name:

          "Code Intelligence",

        status:

          "active"

      },


      {

        name:

          "Development Workflow",

        status:

          "active"

      }

    ]

  }

}







function normalize(items){

  return Array.isArray(items)

    ? [...items]

    : []

}







function count(items){

  return Array.isArray(items)

    ? items.length

    : 0

}







function getDashboardHistory(){

  return [

    ...dashboardHistory

  ]

}







function getLatestDashboardData(){

  return (

    dashboardHistory[
      dashboardHistory.length - 1
    ]

    ||

    null

  )

}







function getDashboardDataStatus(){

  return {

    engine:

      "Spacemonkey Development Dashboard Data Engine",


    version:

      "0.7.0",


    dashboards:

      dashboardHistory.length

  }

}







export {

  createDashboardData,

  getDashboardHistory,

  getLatestDashboardData,

  getDashboardDataStatus

}
