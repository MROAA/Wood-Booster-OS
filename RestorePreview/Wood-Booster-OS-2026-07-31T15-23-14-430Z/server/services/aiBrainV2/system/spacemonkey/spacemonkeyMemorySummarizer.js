const summaryHistory = []



function cleanText(text = ""){

  return String(text)

    .replace(/\s+/g, " ")

    .trim()

}





function createSummary(content = ""){


  const text =
    cleanText(content)



  if(!text){

    return {

      summary:
        "",

      length:
        0

    }

  }





  let summary = text





  const replacements = [


    [

      /^muista että\s*/i,

      ""

    ],


    [

      /^muista\s*/i,

      ""

    ],


    [

      /^haluan aina\s*/i,

      ""

    ],


    [

      /^haluan\s*/i,

      ""

    ],


    [

      /^älä anna\s*/i,

      "Vältä "

    ]

  ]





  for(

    const [

      pattern,

      replacement

    ]

    of replacements

  ){

    summary =

      summary.replace(

        pattern,

        replacement

      )

  }





  if(

    summary.startsWith(

      "kokonaiset tiedostot"

    )

  ){

    summary =

      "Marc käyttää " +

      summary

  }





  summary =

    summary.charAt(0).toUpperCase()

    +

    summary.slice(1)





  if(

    !summary.endsWith(".")

  ){

    summary += "."

  }





  const result = {


    original:

      text,


    summary,


    createdAt:

      new Date().toISOString()

  }





  summaryHistory.push(

    result

  )





  return result

}





function getSummaryHistory(){

  return [

    ...summaryHistory

  ]

}





function getMemorySummarizerStatus(){

  return {


    engine:

      "Spacemonkey Memory Summarizer",


    version:

      "1.0.1",


    summaries:

      summaryHistory.length

  }

}





export {

  createSummary,

  getSummaryHistory,

  getMemorySummarizerStatus

}
