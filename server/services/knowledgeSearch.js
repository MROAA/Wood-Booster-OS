import {
  readKnowledgeFiles,
} from "./knowledgeReader.js"





const PRODUCT_ALIASES = {


  "aurora":

    [
      "aurora",
      "aurora-table",
      "aurora-jokipöytä",
      "aurora pöytä"
    ],



  "jokipöytä":

    [
      "jokipöytä",
      "jokipöydät",
      "river table",
      "river-table",
      "river tables"
    ],



  "epoksi":

    [
      "epoksi",
      "epoxy",
      "resin"
    ],



  "massiivipuu":

    [
      "massiivipuu",
      "massive wood",
      "solid wood"
    ]

}





export async function searchKnowledge(
  query
) {


  const documents =

    await readKnowledgeFiles()





  const text =

    String(query || "")

      .toLowerCase()





  const words =

    text

      .split(/\s+/)

      .map(word =>

        word

          .replace(/[.,!?]/g,"")

      )

      .filter(

        word =>

          word.length > 2

      )







  const expandedWords = [

    ...words

  ]







  /*
  =====================================
  PRODUCT ALIAS EXPANSION
  =====================================
  */


  for (

    const [key, aliases]

    of Object.entries(PRODUCT_ALIASES)

  ) {


    const matched =

      aliases.some(alias =>

        text.includes(alias)

      )



    if (matched) {


      expandedWords.push(

        key

      )


      expandedWords.push(

        ...aliases

      )


    }

  }









  const questionType =

    detectQuestionType(

      text

    )









  const results =

    documents.map(

      document => {


        const filename =

          document.file

            .toLowerCase()



        const content =

          document.content

            .toLowerCase()





        let score = 0







        /*
        =====================================
        KEYWORD MATCH
        =====================================
        */


        for (

          const word

          of expandedWords

        ) {



          if (

            filename.includes(word)

          ) {


            score += 15


          }




          if (

            content.includes(word)

          ) {


            score += 3


          }


        }









        /*
        =====================================
        PRODUCT PRIORITY
        =====================================
        */


        score +=

          productPriority(

            filename,

            text

          )









        /*
        =====================================
        BRAND PRIORITY
        =====================================
        */


        score +=

          identityPriority(

            filename

          )









        /*
        =====================================
        QUESTION TYPE
        =====================================
        */


        score +=

          questionPriority(

            filename,

            questionType

          )







        return {


          ...document,


          score


        }


      }

    )









  return results

    .filter(

      item =>

        item.score > 0

    )

    .sort(

      (a,b) =>

        b.score -

        a.score

    )

    .slice(

      0,

      10

    )


}









function productPriority(

  filename,

  query

) {


  let score = 0





  if (

    query.includes("aurora")

  ) {


    if (

      filename.includes("aurora")

    ) {


      score += 200


    }


  }







  if (

    query.includes("jokipöytä")

    ||

    query.includes("river")

  ) {


    if (

      filename.includes("river")

      ||

      filename.includes("joki")

      ||

      filename.includes("aurora")

    ) {


      score += 150


    }


  }







  if (

    query.includes("epoksi")

  ) {


    if (

      filename.includes("epoxy")

      ||

      filename.includes("epoksi")

    ) {


      score += 150


    }


  }







  if (

    query.includes("materiaali")

  ) {


    if (

      filename.includes("material")

      ||

      filename.includes("materiaali")

    ) {


      score += 120


    }


  }







  return score


}









function detectQuestionType(

  query

) {



  if (

    query.includes("aurora")

    ||

    query.includes("pöytä")

    ||

    query.includes("tuote")

    ||

    query.includes("valmistaa")

  ) {


    return "product"


  }






  if (

    query.includes("hinta")

    ||

    query.includes("hinnoittelu")

    ||

    query.includes("maksaa")

  ) {


    return "business"


  }







  if (

    query.includes("filosofia")

    ||

    query.includes("arvot")

    ||

    query.includes("wood-booster")

  ) {


    return "brand"


  }







  return "general"


}









function identityPriority(

  filename

) {


  let score = 0





  if (

    filename.includes(

      "core_identity"

    )

  ) {


    score += 200


  }







  if (

    filename.includes(

      "brand_values"

    )

  ) {


    score += 150


  }





  if (

    filename.includes(

      "wood-booster"

    )

  ) {


    score += 100


  }







  return score


}









function questionPriority(

  filename,

  type

) {


  let score = 0





  if (

    type === "product"

  ) {


    if (

      filename.includes(

        "product"

      )

    ) {


      score += 100


    }




    if (

      filename.includes(

        "aurora"

      )

    ) {


      score += 150


    }



  }







  if (

    type === "brand"

  ) {


    if (

      filename.includes(

        "brand"

      )

    ) {


      score += 100


    }


  }







  if (

    type === "business"

  ) {


    if (

      filename.includes(

        "pricing"

      )

      ||

      filename.includes(

        "business"

      )

    ) {


      score += 100


    }


  }







  return score


}