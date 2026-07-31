import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const DECISION_TYPES = {


  ACCEPT:
    "accept",


  REJECT:
    "reject",


  DEFER:
    "defer",


  REVIEW:
    "review"

}



const decisionHistory = []



function calculateDecisionScore({

  missionAlignment = 0,

  benefit = 0,

  feasibility = 0,

  risk = 0

}) {


  return (

    missionAlignment * 0.35 +

    benefit * 0.30 +

    feasibility * 0.25 -

    risk * 0.20

  )

}



function evaluateOption({

  option

}) {


  const score =
    calculateDecisionScore({

      missionAlignment:
        option.missionAlignment || 0.5,


      benefit:
        option.benefit || 0.5,


      feasibility:
        option.feasibility || 0.5,


      risk:
        option.risk || 0.5

    })



  return {


    option,


    score,


    evaluatedAt:
      new Date().toISOString()

  }

}



function chooseBestOption({

  options

}) {


  const evaluations =

    options.map(

      option =>

        evaluateOption({

          option

        })

    )



  const best =

    evaluations.sort(

      (a,b)=>

        b.score -
        a.score

    )[0]



  return {


    selected:
      best,


    alternatives:
      evaluations

  }

}



function determineDecisionType({

  score

}) {


  if(
    score >= 0.7
  ){

    return DECISION_TYPES.ACCEPT

  }



  if(
    score >= 0.4
  ){

    return DECISION_TYPES.REVIEW

  }



  if(
    score >= 0.2
  ){

    return DECISION_TYPES.DEFER

  }



  return DECISION_TYPES.REJECT

}



function makeDecision({

  situation,

  options

}) {


  const core =
    getSpacemonkeyCore()



  const result =
    chooseBestOption({

      options

    })



  const decisionType =
    determineDecisionType({

      score:
        result.selected.score

    })



  const decision = {


    id:
      `decision-${Date.now()}`,


    situation,


    selected:
      result.selected,


    type:
      decisionType,


    alternatives:
      result.alternatives,


    coreVersion:
      core.version,


    createdAt:
      new Date().toISOString()

  }



  decisionHistory.push(

    decision

  )



  return {


    agent:
      "spacemonkey",


    decision

  }

}



function getDecisionHistory(){


  return [

    ...decisionHistory

  ]

}



function getDecisionStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    decisions:
      decisionHistory.length,


    history:
      decisionHistory

  }

}



export {

  DECISION_TYPES,

  makeDecision,

  getDecisionHistory,

  getDecisionStatus

}
