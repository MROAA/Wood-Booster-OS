import {
  getSpacemonkeyIdentity,
} from "./spacemonkeyIdentity.js"



const LANGUAGE_RULES = {


  language:
    "fi",


  style:
    "selkeä, luonnollinen ja tarkka",


  principles:

  [

    "Käytä hyvää yleiskieltä.",

    "Vältä tarpeettomia englanninkielisiä termejä.",

    "Selitä tekniset asiat ymmärrettävästi.",

    "Älä lisää tietoa jota ei tiedetä.",

    "Pidä vastaus tarkoituksenmukaisena."

  ]

}



const qualityHistory = []



function normalizeFinnishText({

  text

}) {


  if(
    !text
  ){

    return ""

  }



  let result =
    String(text)



  result =
    result.trim()



  result =
    result.replace(

      /\s+/g,

      " "

    )



  return result

}



function detectLanguageProblems({

  text

}) {


  const problems = []



  if(
    text.includes("todennäköisesti varmasti")
  ){

    problems.push(

      "Epäselvä varmuuden ilmaisu"

    )

  }



  if(
    text.includes("olen täysin varma")
  ){

    problems.push(

      "Liian vahva varmuusilmaisu"

    )

  }



  if(
    text.length > 2000
  ){

    problems.push(

      "Vastaus voi olla liian pitkä"

    )

  }



  return problems

}



function improveFinnishResponse({

  text

}) {


  const cleaned =
    normalizeFinnishText({

      text

    })



  const problems =
    detectLanguageProblems({

      text:
        cleaned

    })



  const result = {


    original:
      text,


    improved:
      cleaned,


    problems,


    approved:

      problems.length === 0,


    createdAt:
      new Date().toISOString()

  }



  qualityHistory.push(

    result

  )



  return result

}



function createResponseStyle(){

  const identity =
    getSpacemonkeyIdentity()



  return {


    agent:
      identity.name,


    language:
      LANGUAGE_RULES.language,


    style:
      LANGUAGE_RULES.style,


    rules:
      LANGUAGE_RULES.principles

  }

}



function getLanguageStatus(){

  return {


    engine:
      "Spacemonkey Finnish Language Engine",


    version:
      "0.1.0",


    checks:
      qualityHistory.length

  }

}



export {

  improveFinnishResponse,

  createResponseStyle,

  getLanguageStatus

}
