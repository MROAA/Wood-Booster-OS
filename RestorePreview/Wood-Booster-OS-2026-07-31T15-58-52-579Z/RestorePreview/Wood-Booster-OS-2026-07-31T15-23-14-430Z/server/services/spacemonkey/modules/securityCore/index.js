const MODULE_ID = "security-core"



const securityPrinciples = [

  {
    id: "core-protection",

    name:
      "Core Protection",

    rule:
      "Never modify stable core systems without validation.",

    level:
      "critical",

  },


  {
    id: "least-privilege",

    name:
      "Least Privilege",

    rule:
      "Every module should have only required permissions.",

    level:
      "critical",

  },


  {
    id: "validation-before-action",

    name:
      "Validation Before Action",

    rule:
      "Analyze and validate before executing operations.",

    level:
      "critical",

  },


  {
    id: "audit-everything",

    name:
      "Audit Trail",

    rule:
      "Important operations must be traceable.",

    level:
      "high",

  },


  {
    id: "human-control",

    name:
      "Human Control",

    rule:
      "High-risk actions require approval.",

    level:
      "critical",

  },


]



function getSecurityCore(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      securityPrinciples.length,

    principles:
      securityPrinciples,

  }

}



function findSecurityRule(id){

  return securityPrinciples.find(
    rule =>
      rule.id === id
  ) || null

}



function getCriticalRules(){

  return securityPrinciples.filter(
    rule =>
      rule.level === "critical"
  )

}



export {

  MODULE_ID,

  getSecurityCore,

  findSecurityRule,

  getCriticalRules,

}
