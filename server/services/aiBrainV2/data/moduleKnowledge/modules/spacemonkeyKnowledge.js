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
      "Tarjoaa Spacemonkey Core -identiteetin, operaattorikerroksen, identiteettirajat, kasvumallin, järjestelmäymmärryksen ja Boosterverse-tarustosisällön (Yggdrasil, manifesti, metsäverkosto, ikuinen juuri, arkkitehtien tarina, Aatos poro, Tommi kissa, Fenrir suojelija, suuri liitto, boosterversen historia).",


    capabilities: [

      "operator_identity",

      "system_awareness",

      "identity_management",

      "self_reflection",

      "knowledge_layer_visibility",

      "boosterverse_lore",

      "yggdrasil",

      "yggdrasilista",

      "yggdrasilin",

      "manifesti",

      "metsäverkosto",

      "myseeliverkko",

      "aatoksesta",

      "aatoksen",

      "aatos",

      "tommista",

      "tommin",

      "tommi",

      "fenriristä",

      "fenririn",

      "fenrir",

      "alliance",

      "grand",

      "liitto",

      "assistentti",

      "assistant",

      "guardian",

      "poro",

      "kissa",

      "historia",

      "timeline",

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
