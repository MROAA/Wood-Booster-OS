import {
  buildGodfileIndex
} from "../index/godfileIndex.js"


import {
  filterKnowledge
} from "../filters/knowledgeFilter.js"



function createKnowledgeContext(
  message
){

  const index =
    buildGodfileIndex()



  const relevantKnowledge =
    filterKnowledge(
      message,
      index
    )



  return {

    source:
      "knowledge-layer",


    totalAvailable:
      index.length,


    matchedSources:
      relevantKnowledge.length,


    knowledge:

      relevantKnowledge.map(
        item => ({

          id:
            item.id,

          category:
            item.category,

          priority:
            item.priority,

          path:
            item.path

        })
      ),


    createdAt:
      new Date().toISOString()

  }

}



export {

  createKnowledgeContext

}
