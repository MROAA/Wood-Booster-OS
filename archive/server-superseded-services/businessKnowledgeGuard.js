export function validateBusinessKnowledge({

  message,

  answer,

  knowledge = [],

}) {


  const warnings = []



  const question =
    message.toLowerCase()



  const response =
    answer.toLowerCase()






  const businessKeywords = [

    "valmistaa",

    "valmistaa",

    "tuote",

    "tuotteet",

    "materiaali",

    "materiaalit",

    "hinta",

    "maksaa",

    "projekti",

    "pöytä",

    "huonekalu",

    "epoksi",

    "puu",

  ]







  const isBusinessQuestion =

    businessKeywords.some(

      word =>
        question.includes(word)

    )







  if (!isBusinessQuestion) {


    return {

      valid:true,

      warnings:[],

      score:100,

    }

  }









  const knowledgeText =

    knowledge

      .map(

        item =>

          `

          ${item.name || ""}

          ${item.title || ""}

          ${item.content || ""}

          `

      )

      .join(" ")

      .toLowerCase()








  if (

    knowledge.length === 0

  ) {


    return {

      valid:true,

      warnings:[],

      score:100,

    }


  }









  const unsupportedClaims = [

    "valmistaa",

    "tuottaa",

    "myy",

    "käyttää",

    "tarjoaa",

  ]






  for (

    const claim of unsupportedClaims

  ) {


    if (

      response.includes(claim)

      &&

      !knowledgeText.includes(claim)

    ) {


      warnings.push({

        type:

          "unsupported_business_claim",


        message:

          `Vastaus sisältää väitteen ilman tietopankkitukea: ${claim}`

      })


    }


  }








  return {


    valid:

      warnings.length === 0,


    warnings,


    score:

      Math.max(

        0,

        100 -

        warnings.length * 20

      )


  }


}
