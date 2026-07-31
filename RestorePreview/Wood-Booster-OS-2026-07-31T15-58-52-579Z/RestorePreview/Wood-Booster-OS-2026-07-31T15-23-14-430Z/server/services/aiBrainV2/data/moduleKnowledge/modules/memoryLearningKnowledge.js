import {
  createModuleKnowledge,
} from "../moduleKnowledgeSchema.js"



const memoryLearningKnowledge =

  createModuleKnowledge({

    id:
      "memory-learning",


    name:
      "Memory Learning Module",


    version:
      "1.0.0",


    description:
      "Luo uusia muistiehdotuksia käyttäjän suorista muistipyynnöistä.",


    capabilities: [

      "memory_creation",

      "memory_learning",

      "memory_proposal",

    ],


    inputs: [

      "user_message",

      "conversation_context",

      "memory_context",

    ],


    outputs: [

      "memory_proposal",

      "memory_candidate",

    ],


    permissions: {

      database:
        false,


      execution:
        false,

    },

  })



export {

  memoryLearningKnowledge,

}
