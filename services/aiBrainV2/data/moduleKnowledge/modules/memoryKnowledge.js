import {
  createModuleKnowledge,
} from "../moduleKnowledgeSchema.js"



const memoryKnowledge =

  createModuleKnowledge({

    id:
      "memory",


    name:
      "Memory Module",


    version:
      "1.0.0",


    description:
      "Hallitsee hyväksyttyjä käyttäjämuistoja, muistiehdotuksia ja pitkäaikaista käyttäjäkontekstia.",


    capabilities: [

      "memory_management",

      "memory_storage",

      "memory_retrieval",

      "user_context",

    ],


    inputs: [

      "memory_proposal",

      "user_context",

      "conversation_context",

    ],


    outputs: [

      "memory_context",

      "stored_memory",

    ],


    permissions: {

      database:
        true,


      execution:
        false,

    },

  })



export {

  memoryKnowledge,

}
