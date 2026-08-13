const MODULE_ID = "networking-capability"



const networkingKnowledge = [

  {
    id: "network-fundamentals",

    name:
      "Network Fundamentals",

    category:
      "networking",

    level:
      "foundation",

    description:
      "Understanding basic computer networking concepts.",

  },


  {
    id: "tcp-ip",

    name:
      "TCP/IP",

    category:
      "protocol",

    level:
      "advanced",

    description:
      "Understanding core communication protocols.",

  },


  {
    id: "ports",

    name:
      "Network Ports",

    category:
      "security",

    level:
      "intermediate",

    description:
      "Understanding service communication through ports.",

  },


  {
    id: "api-communication",

    name:
      "API Communication",

    category:
      "development",

    level:
      "advanced",

    description:
      "Understanding communication between software systems.",

  },


  {
    id: "dns",

    name:
      "DNS",

    category:
      "networking",

    level:
      "intermediate",

    description:
      "Understanding domain name resolution.",

  },


  {
    id: "network-security",

    name:
      "Network Security",

    category:
      "security",

    level:
      "advanced",

    description:
      "Understanding secure network design principles.",

  },

]



function getNetworkingCapability(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      networkingKnowledge.length,

    capabilities:
      networkingKnowledge,

  }

}



function findNetworkingCapability(id){

  return networkingKnowledge.find(
    item =>
      item.id === id
  ) || null

}



function getCapabilitiesByCategory(category){

  return networkingKnowledge.filter(
    item =>
      item.category === category
  )

}



export {

  MODULE_ID,

  getNetworkingCapability,

  findNetworkingCapability,

  getCapabilitiesByCategory,

}
