const MODULE_ID = "creator-pattern-recognition"



const patterns = []



function analyzePattern({

  source,

  observation,

  category,

  evidence,

}){

  const pattern = {

    id:
      `creator-pattern-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    source,

    category,

    observation,

    evidence:
      evidence || [],

    confidence:
      "initial",

    status:
      "observed",

  }


  patterns.push(pattern)


  return pattern

}



function recognizeDecisionPattern(decisions){

  const result = {

    category:
      "decision-pattern",

    observations:
      [],

  }



  decisions.forEach(
    decision => {

      if (
        String(decision.reason)
          .toLowerCase()
          .includes("stable")
      ){

        result.observations.push(
          "Preference for protecting stable foundations."
        )

      }


      if (
        String(decision.lesson)
          .toLowerCase()
          .includes("module")
      ){

        result.observations.push(
          "Preference for modular development."
        )

      }

    }
  )


  return result

}



function getPatterns(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      patterns.length,

    patterns,

  }

}



function getPatternsByCategory(category){

  return patterns.filter(
    pattern =>
      pattern.category === category
  )

}



function getLatestPatterns(){

  return patterns.slice(-5)

}



export {

  MODULE_ID,

  analyzePattern,

  recognizeDecisionPattern,

  getPatterns,

  getPatternsByCategory,

  getLatestPatterns,

}
