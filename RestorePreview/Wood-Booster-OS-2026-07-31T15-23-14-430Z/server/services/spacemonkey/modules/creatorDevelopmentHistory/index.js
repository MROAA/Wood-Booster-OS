const MODULE_ID = "creator-development-history"



const developmentHistory = [

  {
    id: "wood-booster-origin",

    title:
      "Wood-Booster OS Origin",

    phase:
      "foundation",

    description:
      "Creation of the Wood-Booster OS concept and AI operator vision.",

  },


  {
    id: "ai-brain-development",

    title:
      "AI Brain Development",

    phase:
      "intelligence",

    description:
      "Development of AI Brain architecture, agents, memory and knowledge systems.",

  },


  {
    id: "spacemonkey-operator",

    title:
      "Spacemonkey Operator",

    phase:
      "operator",

    description:
      "Evolution from chatbot concept into an operating system operator layer.",

  },


  {
    id: "modular-expansion",

    title:
      "Modular Expansion",

    phase:
      "architecture",

    description:
      "Building isolated modules for safe capability expansion.",

  },


]



function getDevelopmentHistory(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      developmentHistory.length,

    history:
      developmentHistory,

  }

}



function findHistoryEntry(id){

  return developmentHistory.find(
    entry =>
      entry.id === id
  ) || null

}



function getHistoryByPhase(phase){

  return developmentHistory.filter(
    entry =>
      entry.phase === phase
  )

}



export {

  MODULE_ID,

  getDevelopmentHistory,

  findHistoryEntry,

  getHistoryByPhase,

}
