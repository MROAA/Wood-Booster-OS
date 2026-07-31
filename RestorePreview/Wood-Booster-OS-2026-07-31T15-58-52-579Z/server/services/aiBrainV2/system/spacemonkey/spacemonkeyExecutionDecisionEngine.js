const decisionHistory = []



function makeExecutionDecision({

  review,

  approval,

  task

}) {


  const decision = {


    taskId:

      task?.id || null,


    action:

      determineAction({

        review,

        approval

      }),


    reason:

      determineReason({

        review,

        approval

      }),


    confidence:

      calculateConfidence({

        review

      }),


    createdAt:

      new Date().toISOString()

  }



  decisionHistory.push(

    decision

  )



  return decision

}





function determineAction({

  review,

  approval

}) {


  if(

    !review

  ){

    return "stop"

  }



  if(

    review.decision?.action === "stop"

  ){

    return "stop"

  }



  if(

    approval?.approved

  ){

    return "execute"

  }



  return "wait"

}





function determineReason({

  review,

  approval

}) {


  if(

    !review

  ){

    return "Review puuttuu."

  }



  if(

    review.decision?.action === "stop"

  ){

    return review.decision.reason

  }



  if(

    approval?.approved

  ){

    return "Muutos hyväksytty ja valmis suoritukseen."

  }



  return "Odotetaan hyväksyntää."

}





function calculateConfidence({

  review

}) {


  if(

    !review

  ){

    return 0

  }



  if(

    review.risk === "low"

  ){

    return 0.8

  }



  if(

    review.risk === "medium"

  ){

    return 0.6

  }



  return 0.3

}





function getDecisionHistory(){


  return [

    ...decisionHistory

  ]

}





function getExecutionDecisionStatus(){


  return {


    engine:

      "Spacemonkey Execution Decision Engine",


    version:

      "0.1.0",


    decisions:

      decisionHistory.length

  }

}



export {

  makeExecutionDecision,

  getDecisionHistory,

  getExecutionDecisionStatus

}
