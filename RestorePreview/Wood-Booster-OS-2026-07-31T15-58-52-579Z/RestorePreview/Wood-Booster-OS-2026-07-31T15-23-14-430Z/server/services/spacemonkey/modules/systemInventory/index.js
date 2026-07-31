const MODULE_ID = "system-inventory"


const systemModules = [

  {
    id: "identity-layer",
    name: "Identity Layer",
    category: "identity",
    status: "active",
  },


  {
    id: "knowledge-layer",
    name: "Knowledge Layer",
    category: "knowledge",
    status: "active",
  },


  {
    id: "capability-layer",
    name: "Capability Layer",
    category: "capability",
    status: "planned",
  },


  {
    id: "memory-intelligence",
    name: "Memory Intelligence",
    category: "memory",
    status: "active",
  },


  {
    id: "reflection-intelligence",
    name: "Reflection Intelligence",
    category: "reflection",
    status: "active",
  },


  {
    id: "runtime-awareness",
    name: "Runtime Awareness",
    category: "operator",
    status: "planned",
  },


  {
    id: "system-diagnostics",
    name: "System Diagnostics",
    category: "operator",
    status: "planned",
  },

]



function getSystemInventory(){

  return {

    moduleId: MODULE_ID,

    generated:
      new Date().toISOString(),

    count:
      systemModules.length,

    modules:
      systemModules,

  }

}



function findModule(id){

  return systemModules.find(
    module =>
      module.id === id
  ) || null

}



function getModulesByCategory(category){

  return systemModules.filter(
    module =>
      module.category === category
  )

}



export {

  MODULE_ID,

  getSystemInventory,

  findModule,

  getModulesByCategory,

}
