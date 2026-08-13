import {
  findMemory,
  saveMemory,
} from "../../server/services/aiBrainV2/system/spacemonkey/spacemonkeyPersistentMemory.js"



const memoryHistory = []





async function getMemories({

  prisma

}) {


  const memories =

    await findMemory({

      prisma

    })





  const result = {


    system:

      "Spacemonkey Memory Bridge",



    action:

      "read",



    memories,



    source:

    {

      type:

        "Central Core Memory Layer",


      engine:

        "Spacemonkey Persistent Memory"

    },



    createdAt:

      new Date().toISOString()

  }





  memoryHistory.push(

    result

  )





  return result

}







async function remember({

  prisma,

  key,

  content,

  importance

}) {


  const memory =

    await saveMemory({

      prisma,

      key,

      content,

      importance

    })





  const result = {


    system:

      "Spacemonkey Memory Bridge",



    action:

      "save",



    memory,



    source:

    {

      type:

        "Central Core Memory Layer",


      engine:

        "Spacemonkey Persistent Memory"

    },



    createdAt:

      new Date().toISOString()

  }





  memoryHistory.push(

    result

  )





  return result

}







function getMemoryBridgeStatus(){


  return {


    engine:

      "Spacemonkey Memory Bridge",



    version:

      "1.0.0",



    requests:

      memoryHistory.length

  }

}







function getMemoryHistory(){


  return [

    ...memoryHistory

  ]

}







export {

  getMemories,

  remember,

  getMemoryBridgeStatus,

  getMemoryHistory

}
