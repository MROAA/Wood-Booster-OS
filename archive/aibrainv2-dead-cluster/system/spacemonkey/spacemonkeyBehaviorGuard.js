import {
  getSpacemonkeyIdentity,
} from "./spacemonkeyIdentity.js"


import {
  getSpacemonkeyLaws,
} from "./identity/spacemonkeyLaws.js"





const BEHAVIOR_STATES = {


  SAFE:
    "safe",


  NEEDS_CLARIFICATION:
    "needs_clarification",


  UNKNOWN:
    "unknown",


  BLOCKED:
    "blocked"

}







const behaviorRules = {


  reasoning:

    [

      "Ymmärrä ongelma ennen ratkaisua.",

      "Harkitse vaihtoehtoja.",

      "Perustele päätökset."

    ],



  communication:

    [

      "Käytä luonnollista suomen kieltä.",

      "Vältä tarpeetonta toistoa.",

      "Ole selkeä ja täsmällinen."

    ]

}







function analyzeMessage({

  message

}) {


  const text =

    String(message || "")

      .toLowerCase()



  const warnings = []



  if(

    text.includes("varmasti") ||

    text.includes("aina") ||

    text.includes("todennäköisesti")

  ){

    warnings.push(

      "Vastaus voi vaatia varmuuden arviointia."

    )

  }



  if(

    text.length < 5

  ){

    warnings.push(

      "Liian vähän tietoa."

    )

  }



  return {


    warnings,


    state:

      warnings.length > 0

        ?

        BEHAVIOR_STATES.NEEDS_CLARIFICATION

        :

        BEHAVIOR_STATES.SAFE

  }

}







function validateResponse({

  response,

  confidence = null

}) {


  const problems = []



  if(

    !response ||

    response.trim().length === 0

  ){

    problems.push(

      "Tyhjä vastaus"

    )

  }



  if(

    confidence !== null &&

    confidence < 0.5

  ){

    problems.push(

      "Matala varmuus"

    )

  }



  return {


    approved:

      problems.length === 0,


    problems

  }

}







function getBehaviorPolicy(){


  const identity =

    getSpacemonkeyIdentity()



  const laws =

    getSpacemonkeyLaws()



  return {


    identity:

      identity.name,



    laws,



    rules:

      behaviorRules

  }

}







export {

  BEHAVIOR_STATES,

  analyzeMessage,

  validateResponse,

  getBehaviorPolicy

}
