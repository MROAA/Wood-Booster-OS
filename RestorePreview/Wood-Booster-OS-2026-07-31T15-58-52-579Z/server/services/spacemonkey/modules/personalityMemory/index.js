const MODULE_ID = "personality-memory"



const memories = []



function addPersonalityMemory({

  category,

  observation,

  lesson,

}){

  const memory = {

    id:
      `personality-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    category,

    observation,

    lesson,

    status:
      "stored",

  }


  memories.push(memory)


  return memory

}



function getPersonalityMemory(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      memories.length,

    memories,

  }

}



function findMemoriesByCategory(category){

  return memories.filter(
    memory =>
      memory.category === category
  )

}



function getLatestMemories(){

  return memories.slice(-5)

}



export {

  MODULE_ID,

  addPersonalityMemory,

  getPersonalityMemory,

  findMemoriesByCategory,

  getLatestMemories,

}
