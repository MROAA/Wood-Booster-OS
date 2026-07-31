const MODULE_ID = "decision-support"



const decisionCriteria = [

  {
    id: "system-impact",

    name:
      "System Impact",

    description:
      "Evaluate how a decision affects the whole system.",

    priority:
      "high",
  },


  {
    id: "security-impact",

    name:
      "Security Impact",

    description:
      "Evaluate possible security consequences.",

    priority:
      "high",
  },


  {
    id: "maintenance-impact",

    name:
      "Maintenance Impact",

    description:
      "Evaluate long term maintainability.",

    priority:
      "medium",
  },


  {
    id: "mvp-value",

    name:
      "MVP Value",

    description:
      "Evaluate usefulness compared to complexity.",

    priority:
      "medium",
  },


]



function createDecisionFramework(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    criteria:
      decisionCriteria,

    count:
      decisionCriteria.length,

  }

}



function evaluateDecision(input){

  return {

    decision:
      input,

    evaluation:

      {
        status:
          "pending",

        message:
          "Decision requires analysis.",

      },

    criteria:
      decisionCriteria.map(
        criterion =>
          criterion.id
      ),

  }

}



export {

  MODULE_ID,

  createDecisionFramework,

  evaluateDecision,

}
