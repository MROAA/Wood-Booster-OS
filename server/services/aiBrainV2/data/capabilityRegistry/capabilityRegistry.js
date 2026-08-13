import {
  getAllModuleKnowledge,
} from "../moduleKnowledge/moduleKnowledgeProvider.js"



function createCapabilityRegistry(){

  const knowledge =
    getAllModuleKnowledge()


  if(
    !knowledge ||
    !Array.isArray(
      knowledge.modules,
    )
  ){

    return {

      success:
        false,

      source:
        "capability-registry",

      version:
        "1.0.0",

      count:
        0,

      capabilities:
        [],

    }

  }



  const capabilities =

    knowledge.modules.map(
      module => ({

        moduleId:
          module.id,


        name:
          module.identity.name,


        version:
          module.identity.version,


        capabilities:
          module.capabilities,


        inputs:
          module.inputs,


        outputs:
          module.outputs,


        permissions:
          module.permissions,


        description:
          module.description,


        metadata: {

          source:
            "capability-registry",

          version:
            "1.0.0",

        },

      }),
    )



  return {

    success:
      true,


    source:
      "capability-registry",


    version:
      "1.0.0",


    count:
      capabilities.length,


    capabilities,

  }

}





function getCapabilityRegistry(){

  return createCapabilityRegistry()

}





function getCapabilityByModuleId(
  moduleId,
){

  const registry =
    createCapabilityRegistry()


  if(
    !registry.success
  ){

    return null

  }



  return (

    registry.capabilities.find(
      capability =>
        capability.moduleId === moduleId
    )

    ||

    null

  )

}





export {
  createCapabilityRegistry,
  getCapabilityRegistry,
  getCapabilityByModuleId,
}
