import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const KNOWLEDGE_TYPES = {


  FACT:
    "fact",


  PRINCIPLE:
    "principle",


  DOCUMENTATION:
    "documentation",


  PATTERN:
    "pattern",


  RULE:
    "rule"

}



function identifyKnowledgeType({

  content,

}) {


  const text =
    String(content || "")
      .toLowerCase()



  if(
    text.includes("sääntö") ||
    text.includes("rule")
  ){

    return KNOWLEDGE_TYPES.RULE

  }



  if(
    text.includes("periaate") ||
    text.includes("principle")
  ){

    return KNOWLEDGE_TYPES.PRINCIPLE

  }



  if(
    text.includes("dokumentaatio") ||
    text.includes("documentation")
  ){

    return KNOWLEDGE_TYPES.DOCUMENTATION

  }



  if(
    text.includes("aina") ||
    text.includes("koskaan")
  ){

    return KNOWLEDGE_TYPES.PATTERN

  }



  return KNOWLEDGE_TYPES.FACT

}



function evaluateKnowledgeConfidence({

  source,

}) {


  if(
    source === "verified"
  ){

    return 1

  }



  if(
    source === "internal"
  ){

    return 0.8

  }



  return 0.5

}



function createKnowledgeCandidate({

  content,

  source = "unknown"

}) {


  const type =
    identifyKnowledgeType({

      content

    })



  return {


    content,


    source,


    type,


    confidence:

      evaluateKnowledgeConfidence({

        source

      }),


    createdAt:

      new Date().toISOString()


  }


}



function shouldUseKnowledge({

  candidate,

}) {


  if(
    !candidate
  ){

    return false

  }



  return (
    candidate.confidence >= 0.8
  )

}



function prepareKnowledgeRequest({

  content,

  source = "spacemonkey"

}) {


  const core =
    getSpacemonkeyCore()



  const candidate =
    createKnowledgeCandidate({

      content,

      source

    })



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    knowledge:


    {

      candidate,


      usable:

        shouldUseKnowledge({

          candidate

        })

    }

  }


}



export {

  KNOWLEDGE_TYPES,

  createKnowledgeCandidate,

  prepareKnowledgeRequest,

  shouldUseKnowledge

}
