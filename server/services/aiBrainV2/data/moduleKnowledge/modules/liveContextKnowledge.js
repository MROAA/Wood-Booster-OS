import {
  createModuleKnowledge,
} from "../moduleKnowledgeSchema.js"



const liveContextKnowledge =

  createModuleKnowledge({

    id:
      "live_context",


    name:
      "Live Context Module",


    version:
      "1.0.0",


    description:
      "Kertoo käyttäjän nykyisen tilanteen: missä projektissa, asiakkaassa " +
      "tai välilehdessä ollaan juuri nyt, ja mihin huomio (fokus) on kohdistunut.",


    capabilities: [

      "situational_awareness",

      "runtime_context",

      "focus_tracking",

      "active_project_lookup",

    ],


    inputs: [

      "runtime_context",

      "user_message",

    ],


    outputs: [

      "context_snapshot",

      "focus",

    ],


    permissions: {

      database:
        false,


      execution:
        false,

    },

  })



export {

  liveContextKnowledge,

}
