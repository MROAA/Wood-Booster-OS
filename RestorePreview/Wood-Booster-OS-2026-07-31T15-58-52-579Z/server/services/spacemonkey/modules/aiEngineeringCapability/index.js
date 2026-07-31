const MODULE_ID = "ai-engineering-capability"



const aiEngineeringKnowledge = [

  {
    id: "ai-architecture",

    name:
      "AI System Architecture",

    category:
      "architecture",

    level:
      "advanced",

    description:
      "Understanding AI systems, layers and component design.",

  },


  {
    id: "llm-systems",

    name:
      "Large Language Models",

    category:
      "models",

    level:
      "advanced",

    description:
      "Understanding language models and inference systems.",

  },


  {
    id: "agent-systems",

    name:
      "AI Agent Systems",

    category:
      "agents",

    level:
      "advanced",

    description:
      "Understanding autonomous agents and orchestration patterns.",

  },


  {
    id: "memory-systems",

    name:
      "AI Memory Systems",

    category:
      "memory",

    level:
      "advanced",

    description:
      "Understanding short term, long term and contextual memory.",

  },


  {
    id: "knowledge-retrieval",

    name:
      "Knowledge Retrieval",

    category:
      "knowledge",

    level:
      "advanced",

    description:
      "Understanding RAG systems and knowledge grounding.",

  },


  {
    id: "ai-evaluation",

    name:
      "AI Evaluation",

    category:
      "quality",

    level:
      "advanced",

    description:
      "Understanding AI testing, validation and improvement.",

  },


  {
    id: "ai-safety",

    name:
      "AI Safety",

    category:
      "security",

    level:
      "advanced",

    description:
      "Understanding safe AI operation and control mechanisms.",

  },

]



function getAIEngineeringCapability(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      aiEngineeringKnowledge.length,

    capabilities:
      aiEngineeringKnowledge,

  }

}



function findAICapability(id){

  return aiEngineeringKnowledge.find(
    item =>
      item.id === id
  ) || null

}



function getCapabilitiesByCategory(category){

  return aiEngineeringKnowledge.filter(
    item =>
      item.category === category
  )

}



export {

  MODULE_ID,

  getAIEngineeringCapability,

  findAICapability,

  getCapabilitiesByCategory,

}
