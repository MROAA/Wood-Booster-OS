const MODULE_ID = "docker-capability"



const dockerKnowledge = [

  {
    id: "containers",

    name:
      "Docker Containers",

    category:
      "runtime",

    level:
      "advanced",

    description:
      "Understanding isolated application containers.",

  },


  {
    id: "images",

    name:
      "Docker Images",

    category:
      "runtime",

    level:
      "advanced",

    description:
      "Understanding container images and application packaging.",

  },


  {
    id: "volumes",

    name:
      "Docker Volumes",

    category:
      "storage",

    level:
      "intermediate",

    description:
      "Understanding persistent container data storage.",

  },


  {
    id: "networks",

    name:
      "Docker Networks",

    category:
      "networking",

    level:
      "intermediate",

    description:
      "Understanding communication between containers and services.",

  },


  {
    id: "compose",

    name:
      "Docker Compose",

    category:
      "orchestration",

    level:
      "advanced",

    description:
      "Understanding multi-container application definitions.",

  },


  {
    id: "security",

    name:
      "Docker Security",

    category:
      "security",

    level:
      "advanced",

    description:
      "Understanding isolation and container security principles.",

  },

]



function getDockerCapability(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      dockerKnowledge.length,

    capabilities:
      dockerKnowledge,

  }

}



function findDockerCapability(id){

  return dockerKnowledge.find(
    item =>
      item.id === id
  ) || null

}



function getCapabilitiesByCategory(category){

  return dockerKnowledge.filter(
    item =>
      item.category === category
  )

}



export {

  MODULE_ID,

  getDockerCapability,

  findDockerCapability,

  getCapabilitiesByCategory,

}
