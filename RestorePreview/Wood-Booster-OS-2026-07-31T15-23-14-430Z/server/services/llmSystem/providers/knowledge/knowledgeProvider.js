async function getKnowledgeContext(){


  return {

    available:
      false,


    sources:
      [],


    source:
      "knowledge-provider"

  }


}







const knowledgeProvider = {

  id:
    "knowledge",


  name:
    "Knowledge Provider",


  priority:
    40,


  getContext:
    getKnowledgeContext

}







export {

  knowledgeProvider,

  getKnowledgeContext

}
