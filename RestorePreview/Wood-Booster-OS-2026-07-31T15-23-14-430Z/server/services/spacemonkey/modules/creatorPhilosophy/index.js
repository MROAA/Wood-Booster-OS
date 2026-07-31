const MODULE_ID = "creator-philosophy"



const principles = [

  {
    id: "wood-first",

    title:
      "Wood First Philosophy",

    category:
      "brand",

    principle:
      "Respect the material and design with the nature of wood.",

  },


  {
    id: "modular-thinking",

    title:
      "Modular Thinking",

    category:
      "architecture",

    principle:
      "Build complex systems from small independent modules.",

  },


  {
    id: "security-first",

    title:
      "Security First",

    category:
      "engineering",

    principle:
      "Protect system stability before adding new capabilities.",

  },


  {
    id: "continuous-evolution",

    title:
      "Continuous Evolution",

    category:
      "development",

    principle:
      "Improve the system step by step through verified progress.",

  },


  {
    id: "human-centered-ai",

    title:
      "Human Centered AI",

    category:
      "ai",

    principle:
      "AI should support humans and increase creativity.",

  },


]



function getCreatorPhilosophy(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      principles.length,

    principles,

  }

}



function findPrinciple(id){

  return principles.find(
    principle =>
      principle.id === id
  ) || null

}



function getPrinciplesByCategory(category){

  return principles.filter(
    principle =>
      principle.category === category
  )

}



export {

  MODULE_ID,

  getCreatorPhilosophy,

  findPrinciple,

  getPrinciplesByCategory,

}
