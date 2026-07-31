const MODULE_ID = "security-knowledge-base"



const securityKnowledge = [

  {
    id: "threat-modeling",

    title:
      "Threat Modeling",

    category:
      "analysis",

    description:
      "Understanding possible threats before building systems.",

    principle:
      "Identify risks before they become incidents.",

  },


  {
    id: "defense-in-depth",

    title:
      "Defense In Depth",

    category:
      "architecture",

    description:
      "Using multiple protection layers instead of a single defense.",

    principle:
      "A secure system uses several independent protection mechanisms.",

  },


  {
    id: "secure-development",

    title:
      "Secure Development",

    category:
      "development",

    description:
      "Building software with security considered from the beginning.",

    principle:
      "Security is part of design, not an afterthought.",

  },


  {
    id: "least-privilege",

    title:
      "Least Privilege",

    category:
      "access-control",

    description:
      "Systems and modules should receive only necessary permissions.",

    principle:
      "Minimum access reduces possible damage.",

  },


  {
    id: "incident-learning",

    title:
      "Incident Learning",

    category:
      "improvement",

    description:
      "Using previous failures to improve future security.",

    principle:
      "Every incident can become knowledge.",

  },


]



function getSecurityKnowledge(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      securityKnowledge.length,

    knowledge:
      securityKnowledge,

  }

}



function findKnowledge(id){

  return securityKnowledge.find(
    item =>
      item.id === id
  ) || null

}



function getKnowledgeByCategory(category){

  return securityKnowledge.filter(
    item =>
      item.category === category
  )

}



export {

  MODULE_ID,

  getSecurityKnowledge,

  findKnowledge,

  getKnowledgeByCategory,

}
