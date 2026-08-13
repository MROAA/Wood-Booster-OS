const MODULE_ID = "software-engineering-intelligence"



const engineeringKnowledge = [

  {
    id: "modular-design",

    title:
      "Modular Software Design",

    category:
      "architecture",

    principle:
      "Complex systems are built from isolated and maintainable modules.",

  },


  {
    id: "clean-code",

    title:
      "Clean Code",

    category:
      "development",

    principle:
      "Code should be readable, understandable and easy to maintain.",

  },


  {
    id: "testing",

    title:
      "Testing Practice",

    category:
      "quality",

    principle:
      "Every important capability should be verified before integration.",

  },


  {
    id: "security-engineering",

    title:
      "Security Engineering",

    category:
      "security",

    principle:
      "Systems should be designed with protection and isolation in mind.",

  },


  {
    id: "documentation",

    title:
      "Documentation",

    category:
      "maintenance",

    principle:
      "Knowledge must remain understandable for future development.",

  },

]



function getEngineeringKnowledge(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      engineeringKnowledge.length,

    knowledge:
      engineeringKnowledge,

  }

}



function findEngineeringPrinciple(id){

  return engineeringKnowledge.find(
    item =>
      item.id === id
  ) || null

}



function getKnowledgeByCategory(category){

  return engineeringKnowledge.filter(
    item =>
      item.category === category
  )

}



export {

  MODULE_ID,

  getEngineeringKnowledge,

  findEngineeringPrinciple,

  getKnowledgeByCategory,

}
