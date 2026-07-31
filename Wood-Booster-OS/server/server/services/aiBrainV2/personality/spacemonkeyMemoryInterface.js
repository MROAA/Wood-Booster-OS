import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const MEMORY_TYPES = {


  FACT:

    "fact",


  EXPERIENCE:

    "experience",


  DECISION:

    "decision",


  PREFERENCE:

    "preference",


  LESSON:

    "lesson"

}



function evaluateMemoryImportance({

  content,

  type,

}) {


  let importance =
    "low"



  if(
    type === MEMORY_TYPES.DECISION ||
    type === MEMORY_TYPES.LESSON
  ){

    importance =
      "high"

  }



  if(
    content.length > 100
  ){

    importance =
      "medium"

  }



  return importance

}



function identifyMemoryType({

  content,

}) {


  const text =
    String(content || "")
      .toLowerCase()



  if(
    text.includes("päätettiin") ||
    text.includes("decision")
  ){

    return MEMORY_TYPES.DECISION

  }



  if(
    text.includes("opimme") ||
    text.includes("lesson") ||
    text.includes("virhe")
  ){

    return MEMORY_TYPES.LESSON

  }



  if(
    text.includes("pidän") ||
    text.includes("haluan")
  ){

    return MEMORY_TYPES.PREFERENCE

  }



  return MEMORY_TYPES.EXPERIENCE

}



function createMemoryCandidate({

  content,

  source,

}) {


  const type =
    identifyMemoryType({

      content

    })



  return {


    content,


    source,


    type,


    importance:

      evaluateMemoryImportance({

        content,

        type

      }),


    createdAt:

      new Date().toISOString()


  }


}



function shouldStoreMemory({

  candidate,

}) {


  if(
    !candidate
  ){

    return false

  }



  if(
    candidate.importance === "high"
  ){

    return true

  }



  return false

}



function prepareMemoryRequest({

  content,

  source = "spacemonkey"

}) {


  const core =
    getSpacemonkeyCore()



  const candidate =
    createMemoryCandidate({

      content,

      source

    })



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    memory:


    {

      candidate,


      shouldStore:

        shouldStoreMemory({

          candidate

        })

    }

  }


}



export {

  MEMORY_TYPES,

  createMemoryCandidate,

  prepareMemoryRequest,

  shouldStoreMemory

}
