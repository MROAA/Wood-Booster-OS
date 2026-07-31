import {
  createModuleKnowledge,
} from "../moduleKnowledgeSchema.js"



const decisionKnowledge =

  createModuleKnowledge({

    id:
      "decision",


    name:
      "Decision Module",


    version:
      "2.0.0",


    description:
      "Valitsee turvallisesti oikean AI Brain moduulin Reasoning-tuloksen ja capability-tiedon perusteella.",


    capabilities: [

      "module_selection",

      "routing",

      "decision",

      "capability_evaluation",

    ],


    inputs: [

      "reasoning_analysis",

      "capability_context",

      "interaction_context",

    ],


    outputs: [

      "decision_result",

      "selected_module",

    ],


    permissions: {

      database:
        false,


      execution:
        false,

    },

  })



export {

  decisionKnowledge,

}
