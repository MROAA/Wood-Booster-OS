const codingHistory = []



function analyzeCodingRequest({

  message

}) {


  const text =

    String(message || "")

      .toLowerCase()



  const result = {


    type:
      "coding_request",


    target:
      detectTarget(text),


    action:
      detectAction(text),


    needsFile:
      detectNeedsFile(text),


    needsDescription:
      detectNeedsDescription(text),


    createdAt:
      new Date().toISOString()

  }



  codingHistory.push(

    result

  )



  return result

}



function detectTarget(text){


  const targets = [

    "chatpanel",

    "dashboard",

    "sidebar",

    "app",

    "backend",

    "frontend"

  ]



  for(
    const target
    of targets
  ){

    if(
      text.includes(target)
    ){

      return target

    }

  }



  return null

}



function detectAction(text){


  if(

    text.includes("päivitä") ||

    text.includes("päivitys") ||

    text.includes("muuta") ||

    text.includes("korjaa") ||

    text.includes("paranna")

  ){

    return "update"

  }



  if(

    text.includes("luo") ||

    text.includes("tee") ||

    text.includes("rakenna") ||

    text.includes("lisää")

  ){

    return "create"

  }



  return "unknown"

}



function detectNeedsFile(text){


  const changeWords = [

    "päivitä",

    "päivitys",

    "muuta",

    "korjaa",

    "paranna",

    "koodimuutos",

    "refaktoroi"

  ]



  return changeWords.some(

    word =>

      text.includes(word)

  )

}



function detectNeedsDescription(){


  return true

}



function getCodingAnalyzerStatus(){

  return {

    engine:
      "Spacemonkey Coding Analyzer",

    version:
      "0.2.0",

    requests:
      codingHistory.length

  }

}



export {

  analyzeCodingRequest,

  getCodingAnalyzerStatus

}
