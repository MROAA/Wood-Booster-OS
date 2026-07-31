export function validateKnowledgeBoundary({

  message,

  answer,

  knowledge = [],

}) {


  const warnings = []



  const text =

    typeof answer === "string"

      ? answer.toLowerCase()

      :

        String(

          answer?.message?.content ||

          answer?.content ||

          answer?.answer ||

          ""

        ).toLowerCase()






  const hasKnowledge =

    Array.isArray(knowledge) &&

    knowledge.length > 0







  const forbiddenPatterns = [

    "core identity",

    "brand values",

    "ai response rules",

    "decision framework",

    "knowledge priority",

    "system prompt",

    "prompti",

    "sisäinen",

    "lähdetiedosto",

  ]







  for (

    const pattern of forbiddenPatterns

  ) {


    if (

      text.includes(pattern)

    ) {


      warnings.push({

        type:

          "knowledge_leak",


        message:

          `Sisäinen tieto näkyi vastauksessa: ${pattern}`

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