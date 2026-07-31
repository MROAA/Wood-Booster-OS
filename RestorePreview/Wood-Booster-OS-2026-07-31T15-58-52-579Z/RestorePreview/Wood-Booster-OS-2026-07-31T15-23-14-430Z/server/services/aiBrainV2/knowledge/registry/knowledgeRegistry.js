const knowledgeRegistry = [

  {
    id: "SPACEMONKEY_CORE",
    source: "godfiles",
    category: "identity",
    priority: 100,
    enabled: true,
    description:
      "Spacemonkeyn ydinidentiteetti, persoona ja kernel-tieto."
  },


  {
    id: "SYSTEM_RULES",
    source: "system",
    category: "rules",
    priority: 100,
    enabled: true,
    description:
      "Järjestelmän toimintaperiaatteet ja turvallisuussäännöt."
  },


  {
    id: "CREATOR_CONTEXT",
    source: "creator",
    category: "context",
    priority: 90,
    enabled: true,
    description:
      "Wood-Boosterin ja Spacemonkeyn luojan konteksti."
  },


  {
    id: "MEMORY_CONTEXT",
    source: "memory",
    category: "memory",
    priority: 80,
    enabled: true,
    description:
      "Hyväksytty pitkäaikainen muistisisältö."
  },


  {
    id: "PROJECT_KNOWLEDGE",
    source: "projects",
    category: "project",
    priority: 70,
    enabled: true,
    description:
      "Projektitiedot ja järjestelmän projektidata."
  }

]


function getKnowledgeRegistry(){

  return knowledgeRegistry

}


function getKnowledgeSource(id){

  return knowledgeRegistry.find(
    item => item.id === id
  )

}


export {
  getKnowledgeRegistry,
  getKnowledgeSource
}
