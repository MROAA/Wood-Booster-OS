const reviewHistory = []



function reviewChange({

  fileInspection,

  codeChangePlan,

  approval,

  workflow

}) {


  const review = {


    status:

      "reviewed",


    checks:

    {


      fileExists:

        Boolean(

          fileInspection?.exists

        ),


      planExists:

        Boolean(

          codeChangePlan

        ),


      workflowReady:

        Boolean(

          workflow

        ),


      approvalRequired:

        true

    },


    risk:

      evaluateRisk({

        codeChangePlan

      }),


    decision:

      createDecision({

        fileInspection,

        codeChangePlan,

        approval

      }),


    createdAt:

      new Date().toISOString()

  }



  reviewHistory.push(

    review

  )



  return review

}





function evaluateRisk({

  codeChangePlan

}) {


  if(

    !codeChangePlan

  ){

    return "unknown"

  }



  if(

    codeChangePlan.action === "update"

  ){

    return "low"

  }



  if(

    codeChangePlan.action === "create"

  ){

    return "medium"

  }



  return "unknown"

}





function createDecision({

  fileInspection,

  codeChangePlan,

  approval

}) {


  if(

    !fileInspection?.exists

  ){

    return {

      action:

        "stop",


      reason:

        "Tiedostoa ei löydy."

    }

  }



  if(

    !codeChangePlan

  ){

    return {

      action:

        "stop",


      reason:

        "Muutos suunnitelma puuttuu."

    }

  }



  if(

    approval?.approved

  ){

    return {

      action:

        "continue",


      reason:

        "Muutos hyväksytty."

    }

  }



  return {

    action:

      "wait",


    reason:

      "Odotetaan käyttäjän hyväksyntää."

  }

}





function getReviewHistory(){


  return [

    ...reviewHistory

  ]

}





function getReviewStatus(){


  return {


    engine:

      "Spacemonkey Autonomous Review Engine",


    version:

      "0.1.0",


    reviews:

      reviewHistory.length

  }

}



export {

  reviewChange,

  getReviewHistory,

  getReviewStatus

}
