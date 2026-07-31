function getActivityImportance(type){

  switch(type){

    case "PLAN_CREATED":

      return "high"


    case "DECISION_CREATED":

      return "high"


    case "approval_requested":

      return "high"


    case "release_gate_evaluated":

      return "high"


    case "code_generation_completed":

      return "medium"


    case "write_completed":

      return "medium"


    case "code_quality_evaluated":

      return "medium"


    default:

      return "low"

  }

}







function createActivityStream(

  activity = []

){

  if(!Array.isArray(activity)){

    return []

  }





  return activity

    .map(item => ({

      ...item,


      importance:

        getActivityImportance(

          item.type

        )


    }))


    .sort(

      (a,b)=>{

        return (

          new Date(b.createdAt || 0)

          -

          new Date(a.createdAt || 0)

        )

      }

    )

}







function getLatestActivity(

  activity = []

){

  const stream =

    createActivityStream(

      activity

    )


  return stream[0] || null

}







export {

  createActivityStream,

  getLatestActivity

}
