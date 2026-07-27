const qualityHistory = []



function evaluateCodeQuality({

  validation,

  testPlan,

  approval,

  risk

}) {


  let score = 0



  const checks = {

    validation:
      Boolean(validation),

    testing:
      Boolean(testPlan),

    approval:
      Boolean(approval?.approved),

    risk:
      risk || "unknown"

  }





  if(checks.validation){

    score += 30

  }



  if(checks.testing){

    score += 30

  }



  if(checks.approval){

    score += 25

  }



  if(checks.risk === "low"){

    score += 15

  }

  else if(checks.risk === "medium"){

    score += 10

  }





  const result = {


    status:

      score >= 75

        ? "high_quality"

        :

        score >= 50

        ? "acceptable"

        :

        "needs_review",


    score,


    checks,


    recommendations:

    createRecommendations({

      score,

      checks

    }),


    createdAt:

      new Date().toISOString()

  }



  qualityHistory.push(

    result

  )



  return result

}





function createRecommendations({

  score,

  checks

}) {


  const items = []



  if(!checks.approval){

    items.push(
      "User approval required."
    )

  }



  if(!checks.testing){

    items.push(
      "Testing plan required."
    )

  }



  if(score < 75){

    items.push(
      "Additional review recommended."
    )

  }



  if(items.length === 0){

    items.push(
      "Ready for release."
    )

  }



  return items

}





function getCodeQualityStatus(){


  return {

    engine:
      "Spacemonkey Code Quality Engine",

    version:
      "0.1.0",

    evaluations:
      qualityHistory.length

  }

}





export {

  evaluateCodeQuality,

  getCodeQualityStatus

}
