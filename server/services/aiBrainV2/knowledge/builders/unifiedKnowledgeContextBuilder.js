/*
=====================================

WOOD-BOOSTER AI BRAIN V2

UNIFIED KNOWLEDGE CONTEXT BUILDER V4


Vastuut:

- yhdistää kaikki Knowledge Layer lähteet
- tarjoaa kaiken tiedon Context Engineille
- resolverit tekevät lopullisen valinnan


Arkkitehtuuri:

Knowledge Layer
        |
        v
Context Intelligence
        |
        v
Resolverit
        |
        v
Context Fusion


Ei:

- ei päätä mitä käytetään
- ei suodata kysymyksen perusteella
- ei kutsu LLM:ää


=====================================
*/


import {
  loadAllKnowledge,
} from "../loaders/knowledgeLoader.js"







function normalizeKnowledgeItems(results){

  const items = []



  for(
    const result of results
  ){

    if(
      !result.success
    ){

      continue

    }



    const knowledge =
      result.knowledge



    if(
      Array.isArray(
        knowledge
      )
    ){

      items.push(
        ...knowledge
      )

    }


    else if(
      knowledge
    ){

      items.push(
        knowledge
      )

    }

  }



  return items

}







function calculateCharacters(
  knowledge
){

  return knowledge.reduce(

    (
      total,
      item
    ) =>

      total +
      String(
        item.content || ""
      ).length,


    0

  )

}







function calculateHighestPriority(
  knowledge
){

  if(
    knowledge.length === 0
  ){

    return 0

  }



  return Math.max(

    ...knowledge.map(

      item =>
        item.priority || 0

    )

  )

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







function buildUnifiedKnowledgeContext(){

  const results =

    loadAllKnowledge()





  const knowledge =

    normalizeKnowledgeItems(

      results

    )







  return {


    source:

      "unified-knowledge-layer",



    version:

      "4.0.0",



    totalSources:

      knowledge.length,



    highestPriority:

      calculateHighestPriority(

        knowledge

      ),



    totalCharacters:

      calculateCharacters(

        knowledge

      ),



    categories:

      buildCategories(

        knowledge

      ),



    knowledge,



    createdAt:

      new Date()
        .toISOString()


  }


}







export {

  buildUnifiedKnowledgeContext

}
