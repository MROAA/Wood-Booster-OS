const memoryCategories = {


  PREFERENCE:
    "preference",


  EXPERIENCE:
    "experience",


  PRINCIPLE:
    "principle",


  CONTEXT:
    "context"

}



const memoryHistory = []



function evaluateMemoryImportance({

  information,

  category

}) {


  let importance = 0.5



  if(
    category === memoryCategories.PRINCIPLE
  ){

    importance = 1.0

  }


  if(
    category === memoryCategories.PREFERENCE
  ){

    importance = 0.8

  }


  if(
    category === memoryCategories.CONTEXT
  ){

    importance = 0.7

  }



  return {


    information,


    category,


    importance,


    evaluatedAt:
      new Date().toISOString()

  }

}



function createPersonalMemory({

  information,

  category,

  reason

}) {


  const evaluation =
    evaluateMemoryImportance({

      information,

      category

    })



  const memory = {


    id:
      `memory-${Date.now()}`,


    information,


    category,


    importance:
      evaluation.importance,


    reason,


    createdAt:
      new Date().toISOString()

  }



  memoryHistory.push(

    memory

  )



  return memory

}



function shouldRemember({

  importance

}) {


  return importance >= 0.7

}



function getMemoryPersonalityStatus(){

  return {


    engine:
      "Spacemonkey Memory Personality Layer",


    version:
      "0.1.0",


    memories:
      memoryHistory.length

  }

}



function getPersonalMemories(){

  return [

    ...memoryHistory

  ]

}



export {

  memoryCategories,

  createPersonalMemory,

  shouldRemember,

  getPersonalMemories,

  getMemoryPersonalityStatus

}
