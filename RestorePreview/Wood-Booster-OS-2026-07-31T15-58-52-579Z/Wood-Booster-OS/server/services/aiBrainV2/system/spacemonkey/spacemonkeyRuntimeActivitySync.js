import {
  getRecentSpacemonkeyActivities,
} from "./spacemonkeyActivityStore.js"





function extractActivityDetails(activity){

  let plan = null

  let decision = null





  try {


    if(activity?.metadata){


      const metadata =

        JSON.parse(
          activity.metadata
        )



      plan =

        metadata
          ?.dashboardActivity
          ?.activity
          ?.plan
          ?.goal
        ||

        metadata
          ?.data
          ?.plan
          ?.goal
        ||

        null





      decision =

        metadata
          ?.dashboardActivity
          ?.activity
          ?.decision
        ||

        metadata
          ?.data
          ?.decision
        ||

        null


    }


  }

  catch(error){

    plan = null

    decision = null

  }





  return {

    plan,

    decision

  }

}







async function syncRuntimeFromActivity({

  prisma,

} = {}) {



  const activities =

    await getRecentSpacemonkeyActivities({

      prisma

    })





  if(
    !activities ||
    activities.length === 0
  ){

    return {

      state:
        "idle",

      activity:

      {

        lastAction:
          null,

        lastPlan:
          null,

        lastDecision:
          null

      }

    }

  }





  const latest =
    activities[0]





  const details =

    extractActivityDetails(

      latest

    )





  let state =
    "idle"





  if(
    latest.status === "planning"
  ){

    state =
      "planning"

  }





  if(
    latest.status === "decision"
  ){

    state =
      "decision"

  }





  if(
    latest.status === "completed"
  ){

    state =
      "completed"

  }





  return {

    state,

    activity:

    {

      lastAction:

        latest.type,



      lastPlan:

        details.plan
        ||
        latest.message,



      lastDecision:

        details.decision

    }

  }

}







export {

  syncRuntimeFromActivity

}
