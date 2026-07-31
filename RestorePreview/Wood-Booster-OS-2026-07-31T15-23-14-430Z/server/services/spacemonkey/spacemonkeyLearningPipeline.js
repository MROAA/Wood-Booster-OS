/*
=====================================

SPACEMONKEY LEARNING PIPELINE V1


Vastuut:

- vastaanottaa oppimistapahtumia
- luokittelee tapahtuman
- muodostaa knowledge/memory ehdotuksen
- tarjoaa turvallisen oppimiskontekstin


Ei:

- ei kirjoita tietokantaan
- ei hyväksy muistia automaattisesti
- ei kutsu LLM:ää
- ei ohita hyväksyntäkerroksia


=====================================
*/


import {
  createMemoryProposalFromEvent,
} from "./spacemonkeyMemoryBridge.js"







function createLearningEvent({

  name,

  payload = {},

  source = "unknown",

}){


  return {

    name,

    payload,

    source,

    timestamp:
      new Date()
        .toISOString()

  }

}








function classifyLearningEvent(
  event
){


  const name =
    String(
      event?.name ||
      ""
    )
    .toUpperCase()



  if(
    name.includes(
      "ERROR"
    )
  ){

    return {

      category:
        "error",

      importance:
        9,

    }

  }




  if(
    name.includes(
      "COMMAND"
    )
  ){

    return {

      category:
        "action",

      importance:
        5,

    }

  }




  if(
    name.includes(
      "SYSTEM"
    )
  ){

    return {

      category:
        "system",

      importance:
        7,

    }

  }




  return {

    category:
      "general",

    importance:
      3,

  }

}








function createKnowledgeCandidate(
  event
){


  return {


    type:
      "knowledge_candidate",



    source:
      "spacemonkey-learning",



    information:

      JSON.stringify(
        event,
        null,
        2
      ),



    createdAt:
      new Date()
        .toISOString()

  }

}








function processLearningEvent({

  name,

  payload = {},

  source = "unknown",

} = {}){


  const event =
    createLearningEvent({

      name,

      payload,

      source,

    })



  const classification =
    classifyLearningEvent(
      event
    )



  const memoryProposal =
    createMemoryProposalFromEvent(
      event
    )



  const knowledgeCandidate =
    createKnowledgeCandidate(
      event
    )





  return {


    success:
      true,



    event,



    classification,



    memoryProposal,



    knowledgeCandidate,



    status:
      "pending-validation"


  }

}








function getLearningPipelineStatus(){


  return {

    system:
      "Spacemonkey Learning Pipeline",


    version:
      "1.0.0",


    status:
      "READY",


    mode:
      "proposal-only"


  }

}








export {

  processLearningEvent,

  getLearningPipelineStatus,

}
