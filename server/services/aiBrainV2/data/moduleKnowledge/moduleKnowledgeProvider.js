import {
  getModuleKnowledgeRegistry,
  getModuleKnowledgeById,
} from "./moduleKnowledgeRegistry.js"



function getAllModuleKnowledge(){

  const modules =
    getModuleKnowledgeRegistry()


  return {

    source:
      "module-knowledge-provider",


    version:
      "1.0.0",


    count:
      modules.length,


    modules,

  }

}





function getModuleKnowledge(
  moduleId,
){

  const moduleKnowledge =
    getModuleKnowledgeById(
      moduleId,
    )


  return {

    source:
      "module-knowledge-provider",


    version:
      "1.0.0",


    module:
      moduleKnowledge || null,

  }

}





function findModulesByCapability(
  capability,
){

  const modules =
    getModuleKnowledgeRegistry()


  const normalizedCapability =
    String(
      capability || "",
    )
    .trim()
    .toLowerCase()



  if(!normalizedCapability){

    return []

  }



  return modules.filter(

    module =>

      Array.isArray(
        module.capabilities,
      )
      &&
      module.capabilities.some(

        item =>

          String(item)
          .toLowerCase()
          ===
          normalizedCapability

      )

  )

}





export {

  getAllModuleKnowledge,

  getModuleKnowledge,

  findModulesByCapability,

}
