import {
  validateKnowledge
} from "./knowledgeValidator.js"





const knowledgeSources = new Map()







function registerKnowledgeSource({

  id,

  name,

  type,

  search

}) {


  if(
    !id ||
    !search
  ){

    throw new Error(
      "Invalid knowledge source"
    )

  }



  knowledgeSources.set(
    id,
    {
      id,
      name,
      type,
      search
    }
  )


  return id

}







function getKnowledgeSource(id){


  return knowledgeSources.get(
    id
  )

}







function getKnowledgeSources(){


  return Array.from(
    knowledgeSources.values()
  )


}







async function searchKnowledgeSource({

  sourceId,

  query,

  limit = 5

}) {


  const source =
    getKnowledgeSource(
      sourceId
    )



  if(
    !source
  ){

    return []

  }



  const results =
    await source.search({

      query,

      limit

    })



  return results.map(
    item =>

      validateKnowledge(
        item
      )

  )

}







async function routeKnowledge({

  query,

  sources = [],

  limit = 5

}) {


  const results = []



  for(
    const sourceId
    of sources
  ){


    const sourceResults =
      await searchKnowledgeSource({

        sourceId,

        query,

        limit

      })



    results.push(
      ...sourceResults
    )


  }



  return results.filter(

    item =>
      item.valid

  )

}







function createKnowledgeQuery({

  message,

  context = {}

}) {


  return {

    query:
      message.trim(),

    context

  }


}







export {

  registerKnowledgeSource,

  getKnowledgeSource,

  getKnowledgeSources,

  searchKnowledgeSource,

  routeKnowledge,

  createKnowledgeQuery

}
