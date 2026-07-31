import {
  createModuleKnowledge,
} from "../moduleKnowledgeSchema.js"



const reasoningKnowledge =

  createModuleKnowledge({

    id:
      "reasoning",


    name:
      "Reasoning Module",


    version:
      "1.3.0",


    description:
      "Analysoi käyttäjän pyynnön, tunnistaa tarkoituksen ja muodostaa rakenteisen analyysin Decision Layerille.",


    capabilities: [

      "intent_analysis",

      "request_analysis",

      "reasoning",

      "context_analysis",

    ],


    inputs: [

      "user_message",

      "interaction_context",

      "conversation_context",

    ],


    outputs: [

      "reasoning_result",

      "reasoning_analysis",

    ],


    permissions: {

      database:
        false,


      execution:
        false,

    },

  })



export {

  reasoningKnowledge,

}
