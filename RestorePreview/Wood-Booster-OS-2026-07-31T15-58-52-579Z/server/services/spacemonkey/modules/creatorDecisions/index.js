const MODULE_ID = "creator-decisions"



const decisions = [

  {
    id: "modular-architecture",
    title: "Modular Architecture",
    category: "architecture",
    decision:
      "Spacemonkey is built using isolated modules.",
    principle:
      "New capabilities are created as independent modules before integration.",
  },


  {
    id: "core-protection",
    title: "Core Protection",
    category: "architecture",
    decision:
      "Existing cognitive core must remain stable.",
    principle:
      "Do not modify stable core systems without strong reason.",
  },


  {
    id: "mvp-development",
    title: "MVP Development",
    category: "development",
    decision:
      "Build one working module at a time.",
    principle:
      "Small verified steps are preferred over large uncontrolled changes.",
  },


  {
    id: "security-first",
    title: "Security First",
    category: "security",
    decision:
      "New systems must be isolated and controlled.",
    principle:
      "Safety and maintainability are higher priority than speed.",
  },

]



function getCreatorDecisions(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      decisions.length,

    decisions,

  }

}



function findDecision(id){

  return decisions.find(
    decision =>
      decision.id === id
  ) || null

}



function getDecisionsByCategory(category){

  return decisions.filter(
    decision =>
      decision.category === category
  )

}



export {

  MODULE_ID,

  getCreatorDecisions,

  findDecision,

  getDecisionsByCategory,

}
