import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const MEMORY_TYPES = {


  EXPERIENCE:
    "experience",


  LESSON:
    "lesson",


  PRINCIPLE:
    "principle",


  KNOWLEDGE:
    "knowledge"

}



const memoryStore = []



function evaluateImportance({

  content,

}) {


  const text =
    String(content)
      .toLowerCase()



  let score = 0



  if(
    text.includes("lesson") ||
    text.includes("opimme")
  ){

    score += 0.3

  }



  if(
    text.includes("principle") ||
    text.includes("periaate")
  ){

    score += 0.4

  }



  if(
    text.includes("future") ||
    text.includes("tulevaisuus")
  ){

    score += 0.2

  }



  if(
    text.length > 200
  ){

    score += 0.1

  }



  return Math.min(
    score,
    1
  )

}



function classifyMemory({

  content,

}) {


  const text =
    String(content)
      .toLowerCase()



  if(
    text.includes("periaate") ||
    text.includes("principle")
  ){

    return MEMORY_TYPES.PRINCIPLE

  }



  if(
    text.includes("opimme") ||
    text.includes("lesson")
  ){

    return MEMORY_TYPES.LESSON

  }



  return MEMORY_TYPES.EXPERIENCE

}



function consolidateMemory({

  content,

  source = "unknown"

}) {


  const importance =
    evaluateImportance({

      content

    })



  const type =
    classifyMemory({

      content

    })



  const memory = {


    id:
      `memory-${Date.now()}`,


    content,


    type,


    importance,


    source,


    createdAt:
      new Date().toISOString()

  }



  if(
    importance >= 0.5
  ){

    memoryStore.push(
      memory
    )

  }



  return {


    stored:

      importance >= 0.5,


    memory

  }

}



function promoteToKnowledge({

  memory,

}) {


  if(
    memory.type !== MEMORY_TYPES.PRINCIPLE
  ){

    return {


      promoted:false,


      reason:
        "Not a principle memory"

    }

  }



  return {


    promoted:true,


    knowledge:


    {

      type:
        MEMORY_TYPES.KNOWLEDGE,


      content:
        memory.content,


      createdAt:
        new Date().toISOString()

    }

  }

}



function getMemoryStore(){


  return [

    ...memoryStore

  ]

}



function getMemoryStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    totalMemories:
      memoryStore.length,


    memories:
      memoryStore

  }

}



export {

  MEMORY_TYPES,

  consolidateMemory,

  promoteToKnowledge,

  getMemoryStore,

  getMemoryStatus

}
