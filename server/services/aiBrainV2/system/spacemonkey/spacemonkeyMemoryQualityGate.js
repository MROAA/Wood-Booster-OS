const qualityHistory = []





function normalizeText(
  content = ""
){

  return String(content)

    .toLowerCase()

    .trim()

}







function evaluateMemoryQuality({

  content = "",

} = {}) {


  const text =

    normalizeText(

      content

    )





  const importantPatterns = [

    "muista",

    "haluan aina",

    "älä",

    "käytä",

    "käytän",

    "prefer",

    "suosikki",

    "asetus",

    "sääntö",

    "ohje",

    "toive"

  ]





  const temporaryPatterns = [

    "hei",

    "moi",

    "kiitos",

    "mitä kuuluu",

    "testi",

    "kokeilu"

  ]





  let score = 0





  for(
    const pattern
    of importantPatterns
  ){

    if(
      text.includes(pattern)
    ){

      score += 2

    }

  }





  for(
    const pattern
    of temporaryPatterns
  ){

    if(
      text.includes(pattern)
    ){

      score -= 2

    }

  }





  const accepted =

    score >= 2





  const result = {


    accepted,


    score,


    reason:

      accepted

        ?

        "Sisältö vaikuttaa pysyvältä käyttäjämuistilta."

        :

        "Sisältö vaikuttaa väliaikaiselta keskustelulta.",


    analyzedAt:

      new Date().toISOString()

  }





  qualityHistory.push(

    result

  )





  return result

}







function getMemoryQualityGateStatus(){

  return {


    engine:

      "Spacemonkey Memory Quality Gate",


    version:

      "1.0.0",


    checks:

      qualityHistory.length

  }

}







export {

  evaluateMemoryQuality,

  getMemoryQualityGateStatus

}
