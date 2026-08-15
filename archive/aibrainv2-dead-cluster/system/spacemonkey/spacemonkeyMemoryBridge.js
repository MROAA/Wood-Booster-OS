import {
  saveMemory,
  findMemory,
} from "./spacemonkeyPersistentMemory.js"


import {
  categorizeMemory,
} from "./spacemonkeyMemoryCategorizer.js"


import {
  createSummary,
} from "./spacemonkeyMemorySummarizer.js"


import {
  evaluateMemoryQuality,
} from "./spacemonkeyMemoryQualityGate.js"


import {
  checkDuplicateMemory,
} from "./spacemonkeyMemoryDeduplication.js"





function normalizeImportance(
  importance
){

  if(
    typeof importance === "number"
  ){

    if(
      importance >= 8
    ){

      return "high"

    }


    if(
      importance >= 5
    ){

      return "medium"

    }


    return "low"

  }





  if(
    importance === "high" ||
    importance === "medium"
  ){

    return importance

  }





  return "low"

}







function extractText(content){

  if(
    typeof content === "string"
  ){

    return content.trim()

  }



  if(
    content &&
    typeof content === "object"
  ){

    if(
      typeof content.content === "string"
    ){

      return content.content.trim()

    }



    if(
      typeof content.message === "string"
    ){

      return content.message.trim()

    }



    return JSON.stringify(content)

  }



  return String(content || "")

}







async function saveMemoryProposal({

  prisma,

  proposal,

} = {}) {



  if(
    !proposal
  ){

    return {

      saved:false,

      reason:
        "Memory proposal missing."

    }

  }





  const originalContent =

    extractText(

      proposal.content

    )







  const quality =

    evaluateMemoryQuality({

      content:

        originalContent

    })







  if(
    !quality.accepted
  ){

    return {

      saved:false,

      reason:
        "Memory rejected by Quality Gate.",

      quality

    }

  }







  const existingMemories =

    await findMemory({

      prisma

    })







  const duplicate =

    checkDuplicateMemory({

      content:

        originalContent,


      existingMemories

    })







  if(
    duplicate.duplicate
  ){

    return {

      saved:false,

      reason:
        "Memory already exists.",


      duplicate

    }

  }







  const categoryResult =

    categorizeMemory({

      content:

        originalContent

    })







  const summaryResult =

    createSummary(

      originalContent

    )







  const result =

    await saveMemory({

      prisma,


      category:

        categoryResult.category ||

        proposal.category ||

        "spacemonkey",



      key:

        proposal.key ||

        `memory_${Date.now()}`,



      content:

        summaryResult.summary ||

        originalContent,



      importance:

        normalizeImportance(

          proposal.importance

        )

    })







  return {

    source:

      "Spacemonkey Memory Bridge",


    saved:

      result.saved,


    quality,


    duplicate,


    analysis:

    {

      category:

        categoryResult,


      summary:

        summaryResult

    },


    memory:

      result.memory || null

  }

}







function getMemoryBridgeStatus(){

  return {

    engine:

      "Spacemonkey Memory Bridge",


    version:

      "3.0.0",


    status:

      "active"

  }

}







export {

  saveMemoryProposal,

  getMemoryBridgeStatus

}
