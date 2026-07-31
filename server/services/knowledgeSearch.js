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
      "jokipöydän",
      "jokipöydät",
      "river table",
      "river-table",
      "river tables"
    ],


  "epoksi":

    [
      "epoksi",
      "epoksin",
      "epoxy",
      "resin"
    ],


  "massiivipuu":

    [
      "massiivipuu",
      "massiivipuun",
      "massive wood",
      "solid wood"
    ]

}







function normalizeWord(word){

  return String(word || "")

    .toLowerCase()

    .replace(
      /[.,!?;:]/g,
      ""
    )

}







export async function searchKnowledge(query) {


  const documents =

    await readKnowledgeFiles()





  const text =

    String(query || "")

      .toLowerCase()







  const words =

    text

      .split(/\s+/)

      .map(

        word =>

          normalizeWord(word)

      )

      .filter(

        word =>

          word.length > 2

      )







  const expandedWords = [

    ...words

  ]







  for (

    const [key, aliases]

    of Object.entries(PRODUCT_ALIASES)

  ) {


    const matched =

      aliases.some(

        alias =>

          text.includes(alias)

      )



    if(matched){


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







        for (

          const word

          of expandedWords

        ) {


          if(

            filename.includes(word)

          ){

            score += 15

          }




          if(

            content.includes(word)

          ){

            score += 3

          }


        }







        score +=

          productPriority(

            filename,

            text

          )





        score +=

          developmentPriority(

            filename,

            questionType

          )





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









function detectQuestionType(query){


  if(

    query.includes("koodi")

    ||

    query.includes("code")

    ||

    query.includes("javascript")

    ||

    query.includes("react")

    ||

    query.includes("frontend")

    ||

    query.includes("backend")

    ||

    query.includes("api")

    ||

    query.includes("server")

  ){

    return "development"

  }







  if(

    query.includes("aurora")

    ||

    query.includes("pöytä")

    ||

    query.includes("tuote")

    ||

    query.includes("valmistaa")

  ){

    return "product"

  }







  if(

    query.includes("hinta")

    ||

    query.includes("hinnoittelu")

    ||

    query.includes("maksaa")

  ){

    return "business"

  }







  if(

    query.includes("filosofia")

    ||

    query.includes("arvot")

    ||

    query.includes("brändi")

    ||

    query.includes("wood-booster")

  ){

    return "brand"

  }







  return "general"

}









function developmentPriority(

  filename,

  type

){


  let score = 0



  if(

    type !== "development"

  ){

    return score

  }



  if(

    filename.includes("developer")

  ){

    score += 150

  }



  if(

    filename.includes("implementation")

  ){

    score += 120

  }



  if(

    filename.includes("api")

  ){

    score += 100

  }



  if(

    filename.includes("brand")

    ||

    filename.includes("wood-booster")

  ){

    score -= 100

  }



  return score

}









function productPriority(

  filename,

  query

){


  let score = 0





  if(

    query.includes("aurora")

  ){

    if(

      filename.includes("aurora")

    ){

      score += 200

    }

  }







  if(

    query.includes("jokipöytä")

    ||

    query.includes("river")

  ){

    if(

      filename.includes("river")

      ||

      filename.includes("joki")

      ||

      filename.includes("aurora")

    ){

      score += 150

    }

  }







  if(

    query.includes("epoksi")

  ){

    if(

      filename.includes("epoxy")

      ||

      filename.includes("epoksi")

    ){

      score += 150

    }

  }







  return score

}









function questionPriority(

  filename,

  type

){


  let score = 0





  if(

    type === "brand"

  ){

    if(

      filename.includes("brand")

    ){

      score += 100

    }

  }







  if(

    type === "product"

  ){

    if(

      filename.includes("product")

    ){

      score += 100

    }

  }







  if(

    type === "business"

  ){

    if(

      filename.includes("business")

      ||

      filename.includes("pricing")

    ){

      score += 100

    }

  }





  return score

}
