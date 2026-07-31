import {
  createModuleKnowledge,
} from "../moduleKnowledgeSchema.js"



const actionKnowledge =

  createModuleKnowledge({

    id:
      "action",


    name:
      "Action Module",


    version:
      "1.0.0",


    description:
      "Tunnistaa järjestelmän navigointi- ja toimintokomennot turvallisesti ilman suoraa suorittamista.",


    capabilities: [

      "command_detection",

      "navigation",

      "action_routing",

      "system_commands",

    ],


    inputs: [

      "user_message",

      "intent",

      "decision_context",

    ],


    outputs: [

      "action_result",

      "action_target",

    ],


    permissions: {

      database:
        false,


      execution:
        false,

    },

  })



export {

  actionKnowledge,

}
