const MODULE_ID = "creator-intelligence-registry"



const modules = [

  {
    id:
      "creator-identity",

    name:
      "Creator Identity Core",

    version:
      "1.0.0",

    status:
      "active",

    dependencies:
      [],

  },


  {
    id:
      "creator-philosophy-vault",

    name:
      "Creator Philosophy Vault",

    version:
      "1.0.0",

    status:
      "active",

    dependencies:

      [
        "creator-identity",
      ],

  },


  {
    id:
      "creator-decision-memory",

    name:
      "Creator Decision Memory",

    version:
      "1.0.0",

    status:
      "active",

    dependencies:

      [
        "creator-philosophy-vault",
      ],

  },


  {
    id:
      "creator-context-runtime",

    name:
      "Creator Intelligence Runtime",

    version:
      "1.0.0",

    status:
      "active",

    dependencies:

      [
        "creator-context-provider",
        "creator-context-security",
      ],

  },

]



function getRegistry(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      modules.length,

    modules,

  }

}



function findModule(id){

  return modules.find(
    module =>
      module.id === id
  ) || null

}



function getActiveModules(){

  return modules.filter(
    module =>
      module.status === "active"
  )

}



function getDependencies(id){

  const module =
    findModule(id)


  if (!module){

    return []

  }


  return module.dependencies

}



export {

  MODULE_ID,

  getRegistry,

  findModule,

  getActiveModules,

  getDependencies,

}
