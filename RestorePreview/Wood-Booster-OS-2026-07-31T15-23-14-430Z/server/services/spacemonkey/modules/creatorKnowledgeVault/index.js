const MODULE_ID = "creator-knowledge-vault"



const knowledgeEntries = []



function addCreatorKnowledge({

  category,

  title,

  content,

  source,

}){

  const entry = {

    id:
      `creator-knowledge-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    category,

    title,

    content,

    source,

    status:
      "stored",

  }


  knowledgeEntries.push(entry)


  return entry

}



function getCreatorKnowledge(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      knowledgeEntries.length,

    entries:
      knowledgeEntries,

  }

}



function getByCategory(category){

  return knowledgeEntries.filter(
    entry =>
      entry.category === category
  )

}



function searchKnowledge(term){

  const query =
    String(term)
      .toLowerCase()


  return knowledgeEntries.filter(
    entry =>

      entry.title
        .toLowerCase()
        .includes(query)

      ||

      entry.content
        .toLowerCase()
        .includes(query)

  )

}



function getLatestKnowledge(){

  return knowledgeEntries.slice(-5)

}



export {

  MODULE_ID,

  addCreatorKnowledge,

  getCreatorKnowledge,

  getByCategory,

  searchKnowledge,

  getLatestKnowledge,

}
