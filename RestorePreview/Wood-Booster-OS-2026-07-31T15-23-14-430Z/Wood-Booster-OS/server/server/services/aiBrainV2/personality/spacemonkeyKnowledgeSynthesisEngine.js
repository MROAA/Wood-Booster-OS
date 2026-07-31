import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const KNOWLEDGE_TYPES = {


  PATTERN:
    "pattern",


  PRINCIPLE:
    "principle",


  RULE:
    "rule",


  INSIGHT:
    "insight"

}



const knowledgeBase = []



function detectPatterns({

  memories,

}) {


  const patterns = []



  for(
    const memory
    of memories
  ){


    const text =
      String(memory.content)
        .toLowerCase()



    if(
      text.includes("moduuli") ||
      text.includes("module")
    ){

      patterns.push({

        type:
          KNOWLEDGE_TYPES.PATTERN,


        observation:

          "Modular architecture improves system maintainability."

      })

    }



    if(
      text.includes("test") ||
      text.includes("valid")
    ){

      patterns.push({

        type:
          KNOWLEDGE_TYPES.PATTERN,


        observation:

          "Validation before expansion reduces risk."

      })

    }



    if(
      text.includes("oppimme") ||
      text.includes("lesson")
    ){

      patterns.push({

        type:
          KNOWLEDGE_TYPES.INSIGHT,


        observation:

          memory.content

      })

    }

  }



  return patterns

}



function createPrinciple({

  pattern,

}) {


  return {


    id:
      `principle-${Date.now()}`,


    type:
      KNOWLEDGE_TYPES.PRINCIPLE,


    statement:
      pattern.observation,


    confidence:
      0.7,


    createdAt:
      new Date().toISOString()

  }

}



function synthesizeKnowledge({

  memories,

}) {


  const patterns =
    detectPatterns({

      memories

    })



  const principles =

    patterns.map(

      pattern =>

        createPrinciple({

          pattern

        })

    )



  knowledgeBase.push(

    ...principles

  )



  return {


    source:
      "spacemonkey-knowledge-synthesis",


    patterns,


    principles,


    generatedAt:
      new Date().toISOString()

  }

}



function evaluateKnowledge({

  knowledge,

}) {


  return {


    knowledge,


    confidence:

      knowledge.confidence || 0,


    usable:

      knowledge.confidence >= 0.5

  }

}



function getKnowledgeBase(){


  return [

    ...knowledgeBase

  ]

}



function getKnowledgeStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    totalKnowledge:
      knowledgeBase.length,


    knowledge:
      knowledgeBase

  }

}



export {

  KNOWLEDGE_TYPES,

  synthesizeKnowledge,

  evaluateKnowledge,

  getKnowledgeBase,

  getKnowledgeStatus

}
