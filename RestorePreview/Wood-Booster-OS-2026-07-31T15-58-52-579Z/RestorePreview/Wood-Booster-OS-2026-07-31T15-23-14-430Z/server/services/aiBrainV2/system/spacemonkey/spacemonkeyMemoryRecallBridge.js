import {
  findMemory,
} from "./spacemonkeyPersistentMemory.js"





async function recallSpacemonkeyMemory({

  prisma,

  category = "spacemonkey",

} = {}) {


  const memories =

    await findMemory({

      prisma,

      category,

    })





  return {

    source:

      "Spacemonkey Memory Recall Bridge",


    count:

      memories.length,


    memories,


    createdAt:

      new Date().toISOString()

  }

}







async function recallMemoryByCategory({

  prisma,

  category,

} = {}) {


  if(
    !category
  ){

    return {

      count:
        0,

      memories:
        []

    }

  }





  const memories =

    await findMemory({

      prisma,

      category,

    })





  return {

    category,

    count:

      memories.length,


    memories

  }

}







function getMemoryRecallBridgeStatus(){


  return {


    engine:

      "Spacemonkey Memory Recall Bridge",


    version:

      "1.0.0",


    status:

      "active"

  }

}







export {

  recallSpacemonkeyMemory,

  recallMemoryByCategory,

  getMemoryRecallBridgeStatus

}
