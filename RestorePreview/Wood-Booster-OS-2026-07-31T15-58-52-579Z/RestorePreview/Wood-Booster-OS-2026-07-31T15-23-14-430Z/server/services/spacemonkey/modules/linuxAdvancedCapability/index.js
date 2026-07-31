const MODULE_ID = "linux-advanced-capability"



const linuxKnowledge = [

  {
    id: "filesystem",

    name:
      "Linux Filesystem",

    category:
      "system",

    level:
      "advanced",

    description:
      "Understanding of Linux filesystem structure and organization.",

  },


  {
    id: "terminal",

    name:
      "Linux Terminal",

    category:
      "system",

    level:
      "advanced",

    description:
      "Understanding of shell environments and command execution.",

  },


  {
    id: "process-management",

    name:
      "Process Management",

    category:
      "system",

    level:
      "advanced",

    description:
      "Understanding of running processes and system resources.",

  },


  {
    id: "permissions",

    name:
      "Linux Permissions",

    category:
      "security",

    level:
      "advanced",

    description:
      "Understanding users, groups and access control.",

  },


  {
    id: "package-management",

    name:
      "Package Management",

    category:
      "system",

    level:
      "intermediate",

    description:
      "Understanding software installation and updates.",

  },


  {
    id: "services",

    name:
      "Linux Services",

    category:
      "system",

    level:
      "advanced",

    description:
      "Understanding background services and system operation.",

  },

]



function getLinuxCapability(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      linuxKnowledge.length,

    capabilities:
      linuxKnowledge,

  }

}



function findLinuxCapability(id){

  return linuxKnowledge.find(
    item =>
      item.id === id
  ) || null

}



function getCapabilitiesByCategory(category){

  return linuxKnowledge.filter(
    item =>
      item.category === category
  )

}



export {

  MODULE_ID,

  getLinuxCapability,

  findLinuxCapability,

  getCapabilitiesByCategory,

}
