const memoryStore = new Map()





function createMemoryRecord({

  id,

  type = "conversation",

  content,

  source = "user",

  importance = 0.5,

  metadata = {}

}) {


  return {

    id,

    type,

    content,

    source,

    importance,

    metadata,

    createdAt:
      new Date().toISOString()

  }


}







function validateMemory(memory){


  const errors = []



  if(
    !memory.content
  ){

    errors.push(
      "Memory content missing"
    )

  }



  if(
    memory.importance < 0 ||
    memory.importance > 1
  ){

    errors.push(
      "Invalid importance value"
    )

  }



  return {

    valid:
      errors.length === 0,

    errors

  }


}







function shouldStoreMemory({

  content,

  importance = 0

}) {


  if(
    !content
  ){

    return false

  }



  if(
    importance >= 0.7
  ){

    return true

  }



  return false

}







function saveMemory(memory){


  const validation =
    validateMemory(
      memory
    )



  if(
    !validation.valid
  ){

    return {

      success:false,

      errors:
        validation.errors

    }

  }



  memoryStore.set(

    memory.id,

    memory

  )



  return {

    success:true,

    memory

  }


}







function getMemory(id){


  return memoryStore.get(
    id
  )


}







function getAllMemory(){


  return Array.from(
    memoryStore.values()
  )


}







function searchMemory(query){


  const normalized =
    query.toLowerCase()



  return getAllMemory()
    .filter(memory =>

      memory.content
        .toLowerCase()
        .includes(
          normalized
        )

    )

}







function clearMemory(){


  memoryStore.clear()


}





export {

  createMemoryRecord,

  validateMemory,

  shouldStoreMemory,

  saveMemory,

  getMemory,

  getAllMemory,

  searchMemory,

  clearMemory

}
