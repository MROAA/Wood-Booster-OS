/*
=====================================

WOOD-BOOSTER AI BRAIN V2

KNOWLEDGE LOADER V4


Vastuut:

- yhdistää kaikki knowledge providerit
- tukee array provider palautuksia
- tukee yksittäisiä knowledge objekteja


=====================================
*/


import {
  getKnowledgeSource
} from "../registry/knowledgeRegistry.js"



import {
  loadGodfileKnowledge
} from "../providers/godfileProvider.js"



import {
  loadSystemKnowledge
} from "../providers/systemProvider.js"



import {
  loadMemoryKnowledge
} from "../providers/memoryProvider.js"



import {
  loadProjectKnowledge
} from "../providers/projectProvider.js"







const providers = {


  godfiles:

    loadGodfileKnowledge,


  system:

    loadSystemKnowledge,


  memory:

    loadMemoryKnowledge,


  projects:

    loadProjectKnowledge


}







function loadKnowledgeSource(id){


  const source =

    getKnowledgeSource(id)





  if(!source){


    return {


      success:false,


      error:
        "Knowledge source not found"


    }

  }







  const provider =

    providers[source.source]





  if(!provider){


    return {


      success:false,


      error:
        "Provider missing"


    }

  }







  return {


    success:true,


    knowledge:

      provider()


  }


}







function loadAllKnowledge(){


  const ids = [

    "SPACEMONKEY_CORE",

    "SYSTEM_RULES",

    "MEMORY_CONTEXT",

    "PROJECT_KNOWLEDGE"

  ]





  return ids.map(

    id =>

      loadKnowledgeSource(id)

  )


}







export {

  loadKnowledgeSource,

  loadAllKnowledge

}
