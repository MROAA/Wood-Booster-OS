/*
=====================================

AI BRAIN V2

SPACEMONKEY KNOWLEDGE RUNTIME ADAPTER V1


Vastuut:

- liittää Knowledge Layer runtime contextiin
- tarjoaa yhtenäisen knowledge-näkymän

Ei:

- kutsu LLM:ää
- tee päätöksiä
- muuta muistia
- kirjoita tietoa

=====================================
*/


import {
  createKnowledgeContext
} from "../knowledge/adapters/knowledgeContextAdapter.js"



function createSpacemonkeyKnowledgeContext({

  message = "",

} = {}){


  const knowledgeContext =

    createKnowledgeContext(
      message
    )



  return {

    enabled:

      true,


    knowledge:

      knowledgeContext,


    timestamp:

      new Date()
        .toISOString()

  }


}



export {

  createSpacemonkeyKnowledgeContext

}
