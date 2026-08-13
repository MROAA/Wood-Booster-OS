async function getMemoryContext(){


  return {

    available:
      false,


    items:
      [],


    source:
      "memory-provider"

  }


}







const memoryProvider = {

  id:
    "memory",


  name:
    "Memory Provider",


  priority:
    30,


  getContext:
    getMemoryContext

}







export {

  memoryProvider,

  getMemoryContext

}
