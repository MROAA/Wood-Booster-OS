/*
=====================================

SPACEMONKEY MEMORY INTELLIGENCE V2

Vastuut:

- arvioi muistiehdotusten tärkeyttä
- erottaa käskyt kysymyksistä
- estää keskustelun tallentamisen muistiksi

=====================================
*/


import {
  shouldBlockMemoryProposal,
} from "../../../spacemonkey/spacemonkeyMemoryPolicyGuard.js"





const memoryRules = {


  savePatterns:

  [

    "muista",

    "pidä mielessä",

    "haluan aina",

    "käytä aina",

    "jatkossa haluan",

    "asetus"

  ],



  questionPatterns:

  [

    "mitä",

    "mikä",

    "milloin",

    "missä",

    "kuka",

    "kuinka",

    "muistatko"

  ]

}







function evaluateMemoryImportance({

  content,

  key,

  category,

}) {


  const text =

    String(content || "")

      .toLowerCase()

      .trim()





  const policyBlocked =

    shouldBlockMemoryProposal({

      key,

      category,

    })





  if(
    policyBlocked
  ){

    return {

      shouldSave:false,

      importance:"blocked",

      score:0,

      reasons:[
        "Memory Policy Guard esti muistiehdotuksen."
      ]

    }

  }







  let score = 0

  const reasons = []







  const isQuestion =

    memoryRules.questionPatterns.some(

      pattern =>

        text.startsWith(pattern)

    )







  if(
    isQuestion
  ){

    return {

      shouldSave:false,

      importance:"low",

      score:0,

      reasons:[

        "Sisältö on kysymys eikä pysyvä muistiehdotus."

      ]

    }

  }







  for(
    const pattern
    of memoryRules.savePatterns
  ){

    if(
      text.includes(pattern)
    ){

      score += 3

      reasons.push(

        `Sisältää muistiasetuksen: ${pattern}`

      )

    }

  }







  const shouldSave =

    score >= 3







  let importance =

    "low"





  if(
    score >= 6
  ){

    importance =
      "high"

  }

  else if(
    score >= 3
  ){

    importance =
      "medium"

  }







  return {


    shouldSave,


    importance,


    score,


    reasons,


    evaluatedAt:

      new Date()
        .toISOString()


  }

}







function getMemoryIntelligenceStatus(){

  return {

    engine:

      "Spacemonkey Memory Intelligence",

    version:

      "2.0.0",

    policyGuard:

      true

  }

}







export {

  evaluateMemoryImportance,

  getMemoryIntelligenceStatus

}
