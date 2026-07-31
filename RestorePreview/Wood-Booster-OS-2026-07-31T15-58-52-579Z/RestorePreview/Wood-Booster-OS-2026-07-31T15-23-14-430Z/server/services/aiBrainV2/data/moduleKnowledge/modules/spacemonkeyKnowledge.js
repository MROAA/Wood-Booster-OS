import {
  createModuleKnowledge,
} from "../moduleKnowledgeSchema.js"



const spacemonkeyKnowledge =

  createModuleKnowledge({

    id:
      "spacemonkey",


    name:
      "Spacemonkey Module",


    version:
      "2.0.0",


    description:
      "Tarjoaa Spacemonkey Core -identiteetin, operaattorikerroksen, identiteettirajat, kasvumallin ja järjestelmäymmärryksen.",


    capabilities: [

      "operator_identity",

      "system_awareness",

      "identity_management",

      "self_reflection",

      "knowledge_layer_visibility",

    ],


    inputs: [

      "system_context",

      "user_message",

      "identity_context",

      "runtime_context",

    ],


    outputs: [

      "spacemonkey_context",

      "operator_response",

      "identity_state",

    ],


    permissions: {

      database:
        false,


      execution:
        false,

    },

  })



export {

  spacemonkeyKnowledge,

}
