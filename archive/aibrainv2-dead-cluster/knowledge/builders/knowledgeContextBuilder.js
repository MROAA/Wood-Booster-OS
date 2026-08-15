import {
  buildGodfileIndex
} from "../index/godfileIndex.js"



import {
  filterKnowledge
} from "../filters/knowledgeFilter.js"



import {
  loadKnowledgeContent
} from "../loaders/knowledgeContentLoader.js"





function buildKnowledgeContext(
  message = ""
){

  const index =
    buildGodfileIndex()



  const filteredKnowledge =
    filterKnowledge(
      message,
      index
    )



  const knowledgeWithContent =
    loadKnowledgeContent(
      filteredKnowledge
    )



  const totalCharacters =
    knowledgeWithContent.reduce(
      (
        total,
        item
      ) =>
        total +
        item.content.length,

      0
    )



  const highestPriority =

    knowledgeWithContent.length

      ? Math.max(
          ...knowledgeWithContent.map(
            item =>
              item.priority || 0
          )
        )

      : 0




  return {

    source:
      "knowledge-layer",



    totalSources:
      knowledgeWithContent.length,



    highestPriority,



    totalCharacters,



    knowledge:

      knowledgeWithContent,



    createdAt:

      new Date()
        .toISOString()

  }

}





export {

  buildKnowledgeContext

}
