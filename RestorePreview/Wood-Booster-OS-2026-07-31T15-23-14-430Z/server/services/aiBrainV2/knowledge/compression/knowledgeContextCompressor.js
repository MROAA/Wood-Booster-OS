/*
=====================================

WOOD-BOOSTER AI BRAIN V2

KNOWLEDGE CONTEXT COMPRESSOR V2


Vastuut:

- pienentää Knowledge Contextia
- säilyttää tärkeät metatiedot
- valmistaa LLM-kontextin


Ei:

- ei päätä vastausta
- ei muuta tietoa
- ei kirjoita muistia


=====================================
*/





function normalizeKnowledge(
  knowledge = []
){

  if(
    !Array.isArray(
      knowledge
    )
  ){

    return []

  }


  return knowledge.filter(
    Boolean
  )

}








function calculateImportance(
  item
){

  let score = 0



  score +=
    item.priority || 0



  if(
    item.category === "identity"
  ){

    score += 30

  }



  if(
    item.category === "security"
  ){

    score += 25

  }



  if(
    item.source === "system"
  ){

    score += 40

  }



  return score

}








function buildCategories(
  knowledge
){

  return [

    ...new Set(

      knowledge.map(

        item =>
          item.category

      )
      .filter(Boolean)

    )

  ]

}








function compressKnowledgeContext({

  knowledge = [],

  maxSources = 8,

  maxCharacters = 30000,

} = {}){


  const normalized =
    normalizeKnowledge(
      knowledge
    )



  const ranked =

    normalized

      .map(

        item => ({

          item,

          score:
            calculateImportance(
              item
            )

        })

      )


      .sort(

        (
          a,
          b
        ) =>

          b.score -
          a.score

      )





  const selected = []

  let characters = 0





  for(
    const entry
    of ranked
  ){


    if(
      selected.length >= maxSources
    ){

      break

    }



    const contentLength =

      String(
        entry.item.content || ""
      )
      .length





    if(

      characters +
      contentLength >

      maxCharacters

    ){

      continue

    }




    selected.push(
      entry.item
    )



    characters +=
      contentLength


  }





  return {


    source:

      "knowledge-context-compressor",



    version:

      "2.0.0",



    totalSources:

      selected.length,



    totalCharacters:

      characters,



    categories:

      buildCategories(
        selected
      ),



    knowledge:

      selected,



    createdAt:

      new Date()
        .toISOString()


  }


}







export {

  compressKnowledgeContext

}
