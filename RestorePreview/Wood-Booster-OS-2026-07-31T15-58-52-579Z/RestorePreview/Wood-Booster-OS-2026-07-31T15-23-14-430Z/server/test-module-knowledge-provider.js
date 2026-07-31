import {
  getAllModuleKnowledge,
  getModuleKnowledge,
  findModulesByCapability,
} from "./services/aiBrainV2/data/moduleKnowledge/moduleKnowledgeProvider.js"



console.log(
  "ALL MODULE KNOWLEDGE"
)


console.dir(
  getAllModuleKnowledge(),
  {
    depth: null,
  }
)



console.log(
  "SPACEMONKEY MODULE"
)


console.dir(
  getModuleKnowledge(
    "spacemonkey",
  ),
  {
    depth: null,
  }
)



console.log(
  "MEMORY CAPABILITY"
)


console.dir(
  findModulesByCapability(
    "memory_learning",
  ),
  {
    depth: null,
  }
)
