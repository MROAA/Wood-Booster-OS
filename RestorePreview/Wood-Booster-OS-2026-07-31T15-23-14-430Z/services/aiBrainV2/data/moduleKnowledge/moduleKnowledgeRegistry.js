import {
  memoryLearningKnowledge,
} from "./modules/memoryLearningKnowledge.js"


import {
  reasoningKnowledge,
} from "./modules/reasoningKnowledge.js"


import {
  decisionKnowledge,
} from "./modules/decisionKnowledge.js"


import {
  conversationKnowledge,
} from "./modules/conversationKnowledge.js"


import {
  memoryKnowledge,
} from "./modules/memoryKnowledge.js"


import {
  truthKnowledge,
} from "./modules/truthKnowledge.js"


import {
  spacemonkeyKnowledge,
} from "./modules/spacemonkeyKnowledge.js"


import {
  credentialsKnowledge,
} from "./modules/credentialsKnowledge.js"


import {
  actionKnowledge,
} from "./modules/actionKnowledge.js"


import {
  finnishLanguageKnowledge,
} from "./modules/finnishLanguageKnowledge.js"



const moduleKnowledgeRegistry = [

  memoryLearningKnowledge,

  reasoningKnowledge,

  decisionKnowledge,

  conversationKnowledge,

  memoryKnowledge,

  truthKnowledge,

  spacemonkeyKnowledge,

  credentialsKnowledge,

  actionKnowledge,

  finnishLanguageKnowledge,

]





function getModuleKnowledgeRegistry(){

  return moduleKnowledgeRegistry

}





function getModuleKnowledgeById(
  id,
){

  return moduleKnowledgeRegistry.find(

    module =>

      module.id === id

  )

}





export {

  getModuleKnowledgeRegistry,

  getModuleKnowledgeById,

}
