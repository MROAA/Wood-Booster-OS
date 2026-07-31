const MODULE_ID = "cybersecurity-capability"



const cybersecurityKnowledge = [

  {
    id: "security-fundamentals",

    name:
      "Security Fundamentals",

    category:
      "security",

    level:
      "foundation",

    description:
      "Understanding basic cybersecurity principles and protection methods.",

  },


  {
    id: "access-control",

    name:
      "Access Control",

    category:
      "security",

    level:
      "advanced",

    description:
      "Understanding users, permissions and authorization systems.",

  },


  {
    id: "system-hardening",

    name:
      "System Hardening",

    category:
      "operations",

    level:
      "advanced",

    description:
      "Understanding methods for reducing system attack surface.",

  },


  {
    id: "threat-modeling",

    name:
      "Threat Modeling",

    category:
      "analysis",

    level:
      "advanced",

    description:
      "Understanding risks, threats and security planning.",

  },


  {
    id: "secure-development",

    name:
      "Secure Development",

    category:
      "development",

    level:
      "advanced",

    description:
      "Understanding secure software engineering practices.",

  },


  {
    id: "security-auditing",

    name:
      "Security Auditing",

    category:
      "operations",

    level:
      "advanced",

    description:
      "Understanding system review and security verification.",

  },


  {
    id: "ai-security",

    name:
      "AI Security",

    category:
      "ai",

    level:
      "advanced",

    description:
      "Understanding security considerations in AI systems.",

  },

]



function getCybersecurityCapability(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      cybersecurityKnowledge.length,

    capabilities:
      cybersecurityKnowledge,

  }

}



function findCybersecurityCapability(id){

  return cybersecurityKnowledge.find(
    item =>
      item.id === id
  ) || null

}



function getCapabilitiesByCategory(category){

  return cybersecurityKnowledge.filter(
    item =>
      item.category === category
  )

}



export {

  MODULE_ID,

  getCybersecurityCapability,

  findCybersecurityCapability,

  getCapabilitiesByCategory,

}
