const spacemonkeyCapabilities = [

  {

    id:
      "context_awareness",

    name:
      "Context Awareness",

    module:
      "spacemonkey-runtime",

    description:
      "Understands current situation, environment and available information.",

    category:
      "intelligence"

  },


  {

    id:
      "problem_analysis",

    name:
      "Problem Analysis",

    module:
      "spacemonkey-reasoning",

    description:
      "Analyzes problems and identifies important factors.",

    category:
      "reasoning"

  },


  {

    id:
      "information_evaluation",

    name:
      "Information Evaluation",

    module:
      "spacemonkey-reasoning",

    description:
      "Evaluates available information quality and missing knowledge.",

    category:
      "reasoning"

  },


  {

    id:
      "decision_support",

    name:
      "Decision Support",

    module:
      "spacemonkey-decision",

    description:
      "Evaluates options according to mission, values and risks.",

    category:
      "decision"

  },


  {

    id:
      "goal_planning",

    name:
      "Goal Planning",

    module:
      "spacemonkey-planner",

    description:
      "Transforms objectives into structured plans.",

    category:
      "planning"

  },


  {

    id:
      "execution_preparation",

    name:
      "Execution Preparation",

    module:
      "spacemonkey-execution",

    description:
      "Creates controlled execution requests.",

    category:
      "execution"

  },


  {

    id:
      "result_reflection",

    name:
      "Result Reflection",

    module:
      "spacemonkey-reflection",

    description:
      "Analyzes outcomes and extracts lessons.",

    category:
      "learning"

  },


  {

    id:
      "knowledge_improvement",

    name:
      "Knowledge Improvement",

    module:
      "spacemonkey-reflection",

    description:
      "Creates improvement suggestions from experience.",

    category:
      "learning"

  },


  {

    id:
      "system_coordination",

    name:
      "System Coordination",

    module:
      "spacemonkey-orchestrator",

    description:
      "Coordinates multiple intelligence components.",

    category:
      "system"

  }

]



function getSpacemonkeyCapabilities(){

  return spacemonkeyCapabilities

}



function getCapability(id){

  return spacemonkeyCapabilities.find(

    capability =>
      capability.id === id

  )

}



function findCapabilitiesByCategory(category){

  return spacemonkeyCapabilities.filter(

    capability =>
      capability.category === category

  )

}



function getCapabilityStatus(){

  return {

    total:
      spacemonkeyCapabilities.length,

    capabilities:
      spacemonkeyCapabilities

  }

}



export {

  getSpacemonkeyCapabilities,

  getCapability,

  findCapabilitiesByCategory,

  getCapabilityStatus

}
