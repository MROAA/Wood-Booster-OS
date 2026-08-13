const MODULE_ID = "capability-registry"



const capabilities = [

  {
    id: "linux",

    name:
      "Linux Advanced Capability",

    category:
      "system",

    module:
      "linuxAdvancedCapability",

    status:
      "registered",

  },


  {
    id: "docker",

    name:
      "Docker Capability",

    category:
      "infrastructure",

    module:
      "dockerCapability",

    status:
      "registered",

  },


  {
    id: "networking",

    name:
      "Networking Capability",

    category:
      "infrastructure",

    module:
      "networkingCapability",

    status:
      "registered",

  },


  {
    id: "database",

    name:
      "Database Capability",

    category:
      "data",

    module:
      "databaseCapability",

    status:
      "registered",

  },


  {
    id: "ai-engineering",

    name:
      "AI Engineering Capability",

    category:
      "artificial-intelligence",

    module:
      "aiEngineeringCapability",

    status:
      "registered",

  },


  {
    id: "cybersecurity",

    name:
      "Cybersecurity Capability",

    category:
      "security",

    module:
      "cybersecurityCapability",

    status:
      "registered",

  },

]



function getCapabilityRegistry(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      capabilities.length,

    capabilities,

  }

}



function findCapability(id){

  return capabilities.find(
    capability =>
      capability.id === id
  ) || null

}



function getCapabilitiesByCategory(category){

  return capabilities.filter(
    capability =>
      capability.category === category
  )

}



export {

  MODULE_ID,

  getCapabilityRegistry,

  findCapability,

  getCapabilitiesByCategory,

}
