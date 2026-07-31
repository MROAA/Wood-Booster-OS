function parseMetadata(metadata){

  if(!metadata){

    return null

  }


  try{

    return JSON.parse(metadata)

  }

  catch(error){

    return null

  }

}







function extractPlanTitle(activity){


  const data =
    parseMetadata(
      activity.metadata
    )


  return (

    data
      ?.dashboardActivity
      ?.activity
      ?.plan
      ?.goal

    ||

    data
      ?.runtime
      ?.state
      ?.activity
      ?.lastPlan
      ?.goal

    ||

    activity.message

  )

}







function adaptSpacemonkeyActivity(
  activities = []
){


  return activities.map(

    activity => {


      const title =
        extractPlanTitle(
          activity
        )



      return {

        id:
          activity.id,


        type:
          activity.type,


        title:
          activity.type === "PLAN_CREATED"

            ?

            "Suunnitelma luotu"

            :

            activity.type === "DECISION_CREATED"

              ?

              "Päätös tehty"

              :

              activity.type,


        status:
          activity.status,


        message:
          title,


        module:
          activity.module,


        createdAt:
          activity.createdAt

      }


    }

  )

}







export {

  adaptSpacemonkeyActivity

}
