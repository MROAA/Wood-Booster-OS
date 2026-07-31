const MODULE_ID = "technical-intelligence"



const technicalDomains = [

  {
    id: "javascript",
    name: "JavaScript",
    category: "programming",
    level: "foundation",
  },


  {
    id: "nodejs",
    name: "Node.js",
    category: "backend",
    level: "foundation",
  },


  {
    id: "react",
    name: "React",
    category: "frontend",
    level: "foundation",
  },


  {
    id: "python",
    name: "Python",
    category: "programming",
    level: "foundation",
  },


  {
    id: "linux",
    name: "Linux",
    category: "operating-system",
    level: "advanced",
  },


  {
    id: "docker",
    name: "Docker",
    category: "infrastructure",
    level: "foundation",
  },

]



function getTechnicalKnowledgeMap(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    domains:
      technicalDomains,

    count:
      technicalDomains.length,

  }

}



function findTechnicalDomain(id){

  return technicalDomains.find(
    domain =>
      domain.id === id
  ) || null

}



function getDomainsByCategory(category){

  return technicalDomains.filter(
    domain =>
      domain.category === category
  )

}



export {

  MODULE_ID,

  getTechnicalKnowledgeMap,

  findTechnicalDomain,

  getDomainsByCategory,

}
