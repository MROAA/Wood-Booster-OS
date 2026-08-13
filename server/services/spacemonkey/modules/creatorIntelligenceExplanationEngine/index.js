const MODULE_ID = "creator-intelligence-explanation-engine"



const explanations = []



function createExplanation({

  decision,

  sources,

  rules,

  risks,

  confidence,

}){

  const explanation = {

    id:
      `explanation-${Date.now()}`,


    timestamp:
      new Date().toISOString(),


    decision,


    sources:
      sources || [],


    rules:
      rules || [],


    risks:
      risks || [],


    confidence:
      confidence || 0,


    summary:
      generateSummary({

        decision,

        confidence,

      }),

  }



  explanations.push(
    explanation
  )


  return explanation

}



function generateSummary({

  decision,

  confidence,

}){

  return {

    statement:
      `Decision explanation generated for: ${decision}`,


    confidence:

      `${confidence}%`,


    transparent:
      true,

  }

}



function evaluateConfidence({

  evidence,

  validation,

  trust,

}){

  let score = 0



  if (evidence){

    score += 40

  }


  if (validation){

    score += 30

  }


  if (trust){

    score += 30

  }



  return {

    score,


    level:
      score >= 80
        ? "high"
        :
        score >= 50
          ? "medium"
          : "low",

  }

}



function getExplanations(){

  return {

    moduleId:
      MODULE_ID,


    count:
      explanations.length,


    explanations,

  }

}



function getLatestExplanations(){

  return explanations.slice(-10)

}



export {

  MODULE_ID,

  createExplanation,

  evaluateConfidence,

  getExplanations,

  getLatestExplanations,

}
