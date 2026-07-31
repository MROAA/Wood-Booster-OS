const MODULE_ID = "creator-memory-vault"



const memories = [

  {
    id:
      "memory-mimmi",

    name:
      "Mimmi",

    category:
      "personal-memory",

    importance:
      "high",

    meaning:
      "Important personal memory connected to Marc's life.",

    handling:
      "Respectful remembrance.",

  },

]



function getCreatorMemories(){

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



function findMemory(id){

  return memories.find(
    memory =>
      memory.id === id
  ) || null

}



function getImportantMemories(){

  return memories.filter(
    memory =>
      memory.importance === "high"
  )

}



export {

  MODULE_ID,

  getCreatorMemories,

  findMemory,

  getImportantMemories,

}
