const TRUTH_LEVELS = {


  VERIFIED:
    "verified",


  USER_PROVIDED:
    "user_provided",


  INFERRED:
    "inferred",


  UNKNOWN:
    "unknown"

}



const truthHistory = []



function evaluateInformation({

  information,

  source = null

}) {


  const text =
    String(information || "")
      .trim()



  let level =
    TRUTH_LEVELS.UNKNOWN



  let confidence =
    0



  if(
    source === "system" ||
    source === "database"
  ){

    level =
      TRUTH_LEVELS.VERIFIED


    confidence =
      1

  }


  else if(
    source === "user"
  ){

    level =
      TRUTH_LEVELS.USER_PROVIDED


    confidence =
      0.8

  }


  else if(
    text.length > 0
  ){

    level =
      TRUTH_LEVELS.INFERRED


    confidence =
      0.5

  }



  const result = {


    information:


      text,


    level,


    confidence,


    source,


    createdAt:
      new Date().toISOString()

  }



  truthHistory.push(result)



  return result

}



function canUseAsFact({

  truth

}) {


  return (

    truth.level === TRUTH_LEVELS.VERIFIED

    ||

    truth.level === TRUTH_LEVELS.USER_PROVIDED

  )

}



function createTruthAwareResponse({

  statement,

  truth

}) {


  if(
    canUseAsFact({
      truth
    })
  ){

    return {

      statement,

      certainty:
        "varmistettu"

    }

  }



  return {


    statement,


    certainty:
      "epävarma - tarkistettava"

  }

}



function getTruthStatus(){

  return {


    engine:
      "Spacemonkey Truth Engine",


    version:
      "0.1.0",


    evaluations:
      truthHistory.length

  }

}



export {

  TRUTH_LEVELS,

  evaluateInformation,

  canUseAsFact,

  createTruthAwareResponse,

  getTruthStatus

}
