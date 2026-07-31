import {
  getValues,
} from "./spacemonkeyValuesBridge.js"


import {
  makeDecision,
} from "../../server/services/aiBrainV2/system/spacemonkey/spacemonkeyDecisionEngine.js"





const decisionHistory = []







function evaluateDecision({

  options = []

}) {


  const coreValues =

    getValues()





  const decision =

    makeDecision({

      options,

      values:

        coreValues.values.principles

    })





  const result = {


    system:

      "Spacemonkey Decision Bridge",



    valuesUsed:

      coreValues.values.principles,



    decision,



    source:

      {

        type:

          "Central Core Values + Decision Engine",



        values:

          coreValues.values.principles

      },



    createdAt:

      new Date().toISOString()

  }





  decisionHistory.push(

    result

  )





  return result

}







function getDecisionStatus(){


  return {


    engine:

      "Spacemonkey Decision Bridge",


    version:

      "1.1.0",


    decisions:

      decisionHistory.length

  }

}







function getDecisionHistory(){


  return [

    ...decisionHistory

  ]

}







export {

  evaluateDecision,

  getDecisionStatus,

  getDecisionHistory

}
