const intentHistory = []


function normalizeText(message){

  return String(message || "")
    .toLowerCase()
    .trim()

}



function detectIntent({

  message

}) {


  const text =

    normalizeText(message)



  let result = {

    intent:
      "GENERAL_REQUEST",

    confidence:
      0.5,

    message,

    createdAt:
      new Date().toISOString()

  }



  const codingKeywords = [

    "koodimuutos",

    "koodimuutos",

    "päivitä",

    "muokkaa",

    "korjaa",

    "lisää",

    "poista",

    "komponentti",

    "component",

    "chatpanel",

    "jsx",

    "react",

    "tiedosto",

    "anna tiedosto"

  ]



  const codingMatches =

    codingKeywords.filter(

      keyword =>

        text.includes(keyword)

    )



  if(

    codingMatches.length > 0

  ){

    result = {

      intent:
        "CODING_REQUEST",

      confidence:
        Math.min(
          0.95,
          0.5 +
          (
            codingMatches.length * 0.1
          )
        ),

      message,

      matches:
        codingMatches,

      createdAt:
        new Date().toISOString()

    }

  }



  intentHistory.push(

    result

  )



  return result

}



function getIntentHistory(){

  return [

    ...intentHistory

  ]

}



function getIntentStatus(){

  return {

    engine:
      "Spacemonkey Intent Engine",

    version:
      "0.2.0",

    requests:
      intentHistory.length

  }

}



export {

  detectIntent,

  getIntentHistory,

  getIntentStatus

}
