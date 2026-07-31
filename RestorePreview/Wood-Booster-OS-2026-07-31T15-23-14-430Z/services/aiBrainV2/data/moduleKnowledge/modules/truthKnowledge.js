import {
  createModuleKnowledge,
} from "../moduleKnowledgeSchema.js"



const truthKnowledge =

  createModuleKnowledge({

    id:
      "truth",


    name:
      "Truth Module",


    version:
      "1.0.0",


    description:
      "Tarjoaa AI Brainille vahvistetun tiedon käsittelyn ja Truth Layer -periaatteet ilman alkuperäisen Truth Layerin muuttamista.",


    capabilities: [

      "truth_validation",

      "fact_grounding",

      "source_priority",

      "knowledge_filtering",

    ],


    inputs: [

      "knowledge_context",

      "truth_bundle",

      "user_message",

    ],


    outputs: [

      "validated_truth",

      "truth_context",

    ],


    permissions: {

      database:
        false,


      execution:
        false,

    },

  })



export {

  truthKnowledge,

}
