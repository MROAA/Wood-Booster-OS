import {
  buildMVPPlan,
} from "../../server/services/aiBrainV2/system/spacemonkey/spacemonkeyPlanningEngine.js"



const planningHistory = []







function createPlan({

  goal,

  decision

}) {


  const plan =

    buildMVPPlan({

      goal,

      decision

    })





  const result = {


    system:

      "Spacemonkey Planning Bridge",



    plan,



    source:

    {

      type:

        "Central Core Planning Layer",


      engine:

        "Spacemonkey Planning Engine"

    },



    createdAt:

      new Date().toISOString()

  }





  planningHistory.push(

    result

  )





  return result

}







function getPlanningStatus(){


  return {


    engine:

      "Spacemonkey Planning Bridge",


    version:

      "1.0.0",


    plans:

      planningHistory.length

  }

}







function getPlanningHistory(){


  return [

    ...planningHistory

  ]

}







export {

  createPlan,

  getPlanningStatus,

  getPlanningHistory

}
