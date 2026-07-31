import {
  findMemory,
} from "./spacemonkeyPersistentMemory.js"


import {
  retrieveRelevantMemories,
} from "./spacemonkeyMemoryRetrieval.js"



const recallHistory = []



async function recallMemories({

  prisma,

  query

}) {


  const memories =

    await findMemory({

      prisma

    })



  const retrieved =

    retrieveRelevantMemories({

      query,

      memories

    })



  const result = {


    found:
      retrieved.found,


    count:
      retrieved.count,


    memories:
      retrieved.memories,


    retrieval:
      retrieved,


    createdAt:
      new Date().toISOString()

  }



  recallHistory.push(

    result

  )



  return result

}



function getRecallHistory(){

  return [

    ...recallHistory

  ]

}



function getMemoryRecallStatus(){

  return {


    engine:
      "Spacemonkey Memory Recall Engine",


    version:
      "0.2.0",


    recalls:
      recallHistory.length

  }

}



export {

  recallMemories,

  getRecallHistory,

  getMemoryRecallStatus

}
