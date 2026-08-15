const curiosityHistory = []


const CURIOSITY_LEVELS = {


  LOW:
    "low",


  MEDIUM:
    "medium",


  HIGH:
    "high"

}



function detectUnknowns({

  information

}) {


  const text =
    String(information || "")
      .toLowerCase()



  const unknowns = []



  const indicators = [

    "en tiedä",

    "puuttuu",

    "epäselvä",

    "tarvitaan lisää",

    "ei varmistettu"

  ]



  for(
    const indicator
    of indicators
  ){

    if(
      text.includes(indicator)
    ){

      unknowns.push(

        indicator

      )

    }

  }



  return unknowns

}



function calculateCuriosityLevel({

  unknownCount,

  importance = 0.5

}) {


  const score =

    unknownCount * 0.2 +

    importance * 0.8



  if(
    score >= 0.7
  ){

    return CURIOSITY_LEVELS.HIGH

  }



  if(
    score >= 0.4
  ){

    return CURIOSITY_LEVELS.MEDIUM

  }



  return CURIOSITY_LEVELS.LOW

}



function createInvestigation({

  topic,

  reason,

  importance = 0.5

}) {


  const unknowns =
    detectUnknowns({

      information:
        reason

    })



  const investigation = {


    id:
      `investigation-${Date.now()}`,


    topic,


    reason,


    unknowns,


    level:

      calculateCuriosityLevel({

        unknownCount:
          unknowns.length,


        importance

      }),


    questions:

    [

      `Mitä tietoa tarvitaan aiheesta: ${topic}?`,

      `Miten tämä voidaan varmistaa?`

    ],


    createdAt:
      new Date().toISOString()

  }



  curiosityHistory.push(

    investigation

  )



  return investigation

}



function shouldExplore({

  investigation

}) {


  return (

    investigation.level !== CURIOSITY_LEVELS.LOW

  )

}



function getCuriosityStatus(){

  return {


    engine:
      "Spacemonkey Curiosity & Exploration Engine",


    version:
      "0.1.0",


    investigations:
      curiosityHistory.length

  }

}



export {

  CURIOSITY_LEVELS,

  detectUnknowns,

  createInvestigation,

  shouldExplore,

  getCuriosityStatus

}
