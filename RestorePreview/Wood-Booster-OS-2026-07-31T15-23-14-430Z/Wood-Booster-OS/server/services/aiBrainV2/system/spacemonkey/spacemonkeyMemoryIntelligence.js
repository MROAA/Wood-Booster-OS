const memoryRules = {


  saveKeywords:

  [

    "muista",

    "haluan",

    "aina",

    "käytä",

    "pidä mielessä",

    "preferenssi",

    "asetus"

  ],


  ignorePatterns:

  [

    "mikä",

    "mitä",

    "milloin",

    "missä",

    "kuka",

    "kuinka"

  ]

}



function evaluateMemoryImportance({

  content

}) {


  const text =

    String(content || "")

      .toLowerCase()



  let score = 0



  const reasons = []



  for(
    const keyword
    of memoryRules.saveKeywords
  ){

    if(
      text.includes(keyword)
    ){

      score += 2


      reasons.push(

        `Sisältää muistamiseen viittaavan sanan: ${keyword}`

      )

    }

  }



  for(
    const pattern
    of memoryRules.ignorePatterns
  ){

    if(
      text.startsWith(pattern)
    ){

      score -= 2

    }

  }



  const shouldSave =

    score >= 2



  let importance =

    "low"



  if(
    score >= 5
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
      new Date().toISOString()

  }

}



function getMemoryIntelligenceStatus(){


  return {

    engine:
      "Spacemonkey Memory Intelligence",


    version:
      "0.1.0"

  }

}



export {

  evaluateMemoryImportance,

  getMemoryIntelligenceStatus

}
