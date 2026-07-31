import {
  createModuleKnowledge,
} from "../moduleKnowledgeSchema.js"



const conversationKnowledge =

  createModuleKnowledge({

    id:
      "conversation",


    name:
      "Conversation Module",


    version:
      "2.11.0",


    description:
      "Keskustelumoduuli, joka muodostaa käyttäjälle vastauksen Context Enginen tuottaman tiedon perusteella ilman päällekkäisiä guard-käsittelyjä.",


    capabilities: [

      "conversation",

      "response_generation",

      "context_response",

      "natural_language_response",

    ],


    inputs: [

      "user_message",

      "reasoning_analysis",

      "decision_result",

      "knowledge_context",

      "memory_context",

    ],


    outputs: [

      "assistant_response",

      "conversation_result",

    ],


    permissions: {

      database:
        false,


      execution:
        false,

    },

  })



export {

  conversationKnowledge,

}
