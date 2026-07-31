const MODULE_ID = "personality-module-registry"



const personalityModules = [

  {
    id:
      "personality-character",

    name:
      "Personality Character Module",

    category:
      "identity",

    status:
      "active",

  },


  {
    id:
      "personality-rules",

    name:
      "Personality Rule Registry",

    category:
      "rules",

    status:
      "active",

  },


  {
    id:
      "personality-memory",

    name:
      "Personality Memory Module",

    category:
      "memory",

    status:
      "active",

  },


  {
    id:
      "personality-humor",

    name:
      "Humor Personality Module",

    category:
      "behavior",

    status:
      "active",

  },


  {
    id:
      "personality-safety",

    name:
      "Personality Safety Boundary",

    category:
      "safety",

    status:
      "active",

  },


  {
    id:
      "personality-context",

    name:
      "Personality Context Builder",

    category:
      "runtime",

    status:
      "active",

  },

]



function getPersonalityRegistry(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      personalityModules.length,

    modules:
      personalityModules,

  }

}



function findPersonalityModule(id){

  return personalityModules.find(
    module =>
      module.id === id
  ) || null

}



function getModulesByCategory(category){

  return personalityModules.filter(
    module =>
      module.category === category
  )

}



function getActiveModules(){

  return personalityModules.filter(
    module =>
      module.status === "active"
  )

}



export {

  MODULE_ID,

  getPersonalityRegistry,

  findPersonalityModule,

  getModulesByCategory,

  getActiveModules,

}
