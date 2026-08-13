const MODULE_ID = "personal-knowledge-base"



const knowledgeEntries = [

  {
    id: "creator-profile",

    title:
      "Creator Profile",

    category:
      "identity",

    description:
      "Core information structure about the system creator.",

  },


  {
    id: "wood-booster-project",

    title:
      "Wood-Booster HQ",

    category:
      "project",

    description:
      "Main AI operating system development project.",

  },


  {
    id: "technical-learning",

    title:
      "Technical Learning",

    category:
      "skills",

    description:
      "Programming, AI engineering and system development knowledge.",

  },


  {
    id: "creative-domain",

    title:
      "Creative Domain",

    category:
      "creative",

    description:
      "Woodworking, design and product creation knowledge.",

  },


  {
    id: "future-development",

    title:
      "Future Development",

    category:
      "planning",

    description:
      "Future goals and expansion directions.",

  },

]



function getPersonalKnowledgeBase(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      knowledgeEntries.length,

    entries:
      knowledgeEntries,

  }

}



function findKnowledgeEntry(id){

  return knowledgeEntries.find(
    entry =>
      entry.id === id
  ) || null

}



function getKnowledgeByCategory(category){

  return knowledgeEntries.filter(
    entry =>
      entry.category === category
  )

}



export {

  MODULE_ID,

  getPersonalKnowledgeBase,

  findKnowledgeEntry,

  getKnowledgeByCategory,

}
