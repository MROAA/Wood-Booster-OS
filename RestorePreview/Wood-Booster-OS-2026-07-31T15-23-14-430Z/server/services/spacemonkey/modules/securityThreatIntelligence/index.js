const MODULE_ID = "security-threat-intelligence"



const threatPatterns = [

  {
    id: "unauthorized-access",

    name:
      "Unauthorized Access",

    category:
      "access",

    risk:
      "critical",

    description:
      "Attempts to access systems without permission.",

    defense:
      "Use authentication, authorization and least privilege.",

  },


  {
    id: "data-exposure",

    name:
      "Data Exposure",

    category:
      "data",

    risk:
      "critical",

    description:
      "Sensitive information becoming accessible externally.",

    defense:
      "Protect data access and validate sharing permissions.",

  },


  {
    id: "unsafe-execution",

    name:
      "Unsafe Execution",

    category:
      "execution",

    risk:
      "high",

    description:
      "Running actions without proper validation.",

    defense:
      "Use approval gates and sandboxing.",

  },


  {
    id: "dependency-risk",

    name:
      "Dependency Risk",

    category:
      "software",

    risk:
      "medium",

    description:
      "Security issues caused by external dependencies.",

    defense:
      "Review dependencies and keep systems updated.",

  },


  {
    id: "social-engineering",

    name:
      "Social Engineering",

    category:
      "human",

    risk:
      "high",

    description:
      "Manipulation attempts targeting users or operators.",

    defense:
      "Validate instructions and maintain trust boundaries.",

  },

]



function getThreatIntelligence(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      threatPatterns.length,

    threats:
      threatPatterns,

  }

}



function findThreat(id){

  return threatPatterns.find(
    threat =>
      threat.id === id
  ) || null

}



function getCriticalThreats(){

  return threatPatterns.filter(
    threat =>
      threat.risk === "critical"
  )

}



function getThreatsByCategory(category){

  return threatPatterns.filter(
    threat =>
      threat.category === category
  )

}



export {

  MODULE_ID,

  getThreatIntelligence,

  findThreat,

  getCriticalThreats,

  getThreatsByCategory,

}
