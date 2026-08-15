function countByType(
  activity = [],
  types = []
){

  return activity.filter(

    item =>

      types.includes(
        item.type
      )

  ).length

}







function createActivityStatistics(

  activity = []

){

  if(!Array.isArray(activity)){

    return {

      total: 0,

      plans: 0,

      decisions: 0,

      codeEvents: 0,

      approvals: 0

    }

  }





  return {

    total:

      activity.length,



    plans:

      countByType(

        activity,

        [
          "PLAN_CREATED"
        ]

      ),



    decisions:

      countByType(

        activity,

        [
          "DECISION_CREATED"
        ]

      ),



    codeEvents:

      countByType(

        activity,

        [

          "code_generation_completed",

          "code_execution_simulated",

          "code_quality_evaluated",

          "write_completed"

        ]

      ),



    approvals:

      countByType(

        activity,

        [

          "approval_requested",

          "approval_granted",

          "approved_change_execution"

        ]

      )

  }

}







export {

  createActivityStatistics

}
