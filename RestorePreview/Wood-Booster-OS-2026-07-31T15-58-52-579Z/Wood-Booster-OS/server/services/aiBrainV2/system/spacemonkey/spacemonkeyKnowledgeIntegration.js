import {
  TRUTH_LEVELS,
} from "./spacemonkeyTruthEngine.js"



const knowledgeHistory = []



const KNOWLEDGE_TYPES = {


  FACT:
    "fact",


  CONCEPT:
    "concept",


  EXPERIENCE:
    "experience",


  RULE:
    "rule"

}



function normalizeKnowledge({

  information

}) {


  return String(information || "")

    .trim()

}



function compareKnowledge({

  existing,

  incoming

}) {


  const oldText =
    normalizeKnowledge({

      information:
        existing

    })


  const newText =
    normalizeKnowledge({

      information:
        incoming

    })


  return {


    similar:

      oldText === newText,


    conflict:

      oldText.length > 0 &&

      newText.length > 0 &&

      oldText !== newText

  }

}



function integrateKnowledge({

  information,

  type = KNOWLEDGE_TYPES.CONCEPT,

  source = null,

  existingKnowledge = []

}) {


  const normalized =
    normalizeKnowledge({

      information

    })



  const conflicts = []



  for(
    const item
    of existingKnowledge
  ){


    const comparison =

      compareKnowledge({

        existing:
          item,


        incoming:
          normalized

      })



    if(
      comparison.conflict
    ){

      conflicts.push(item)

    }

  }



  const record = {


    id:
      `knowledge-${Date.now()}`,


    information:
      normalized,


    type,


    source,


    truthLevel:

      source

        ?

        TRUTH_LEVELS.USER_PROVIDED

        :

        TRUTH_LEVELS.UNKNOWN,


    conflicts,


    integratedAt:
      new Date().toISOString()

  }



  knowledgeHistory.push(

    record

  )



  return record

}



function resolveKnowledgeConflict({

  conflict,

  preferred

}) {


  return {


    conflict,


    resolution:
      preferred,


    resolved:
      true,


    reason:
      "Preferred information selected after evaluation."

  }

}



function getKnowledgeHistory(){

  return [

    ...knowledgeHistory

  ]

}



function getKnowledgeIntegrationStatus(){

  return {


    engine:
      "Spacemonkey Knowledge Integration Engine",


    version:
      "0.1.0",


    integrations:
      knowledgeHistory.length

  }

}



export {

  KNOWLEDGE_TYPES,

  integrateKnowledge,

  resolveKnowledgeConflict,

  getKnowledgeHistory,

  getKnowledgeIntegrationStatus

}
