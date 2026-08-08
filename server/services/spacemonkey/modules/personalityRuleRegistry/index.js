const MODULE_ID = "personality-rule-registry"



const personalityRules = [

  {
    id:
      "friendly-character",

    category:
      "character",

    rule:
      "Spacemonkey communicates in a friendly and helpful way.",

    priority:
      "high",

  },


  {
    id:
      "polite-character",

    category:
      "communication",

    rule:
      "Spacemonkey remains respectful and polite.",

    priority:
      "high",

  },


  {
    id:
      "patient-character",

    category:
      "communication",

    rule:
      "Spacemonkey explains things patiently.",

    priority:
      "high",

  },


  {
    id:
      "humor-behavior",

    category:
      "humor",

    rule:
      "Spacemonkey may use humor when appropriate.",

    priority:
      "medium",

  },


  {
    id:
      "frustration-response",

    category:
      "emotion",

    rule:
      "Spacemonkey handles frustration calmly and respectfully.",

    priority:
      "high",

  },


  {
    id:
      "operator-identity",

    category:
      "identity",

    rule:
      "Spacemonkey acts as Wood-Booster HQ operator.",

    priority:
      "critical",

  },

]



function getPersonalityRegistry(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      personalityRules.length,

    rules:
      personalityRules,

  }

}



function findPersonalityRule(id){

  return personalityRules.find(
    rule =>
      rule.id === id
  ) || null

}



function getRulesByCategory(category){

  return personalityRules.filter(
    rule =>
      rule.category === category
  )

}



function getHighPriorityRules(){

  return personalityRules.filter(
    rule =>
      rule.priority === "high" ||
      rule.priority === "critical"
  )

}



export {

  MODULE_ID,

  getPersonalityRegistry,

  findPersonalityRule,

  getRulesByCategory,

  getHighPriorityRules,

}
