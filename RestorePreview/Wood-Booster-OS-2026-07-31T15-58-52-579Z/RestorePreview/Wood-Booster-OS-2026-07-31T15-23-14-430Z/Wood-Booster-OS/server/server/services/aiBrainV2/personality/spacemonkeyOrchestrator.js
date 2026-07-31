import {
  runSpacemonkeyRuntime,
} from "./spacemonkeyRuntime.js"


import {
  runSpacemonkeyReasoning,
} from "./spacemonkeyReasoningEngine.js"


import {
  runSpacemonkeyDecision,
} from "./spacemonkeyDecisionEngine.js"


import {
  runSpacemonkeyPlannerBridge,
} from "./spacemonkeyPlannerBridge.js"


import {
  runSpacemonkeyExecutionBridge,
} from "./spacemonkeyExecutionBridge.js"


import {
  runSpacemonkeyReflection,
} from "./spacemonkeyReflectionEngine.js"



async function runSpacemonkey({

  message,

  systemContext = {},

  memory = [],

  knowledge = [],

}){


  /*
    PHASE 1

    Activate runtime context
  */


  const runtime =
    await runSpacemonkeyRuntime({

      message,

      systemContext,

      memory,

      knowledge

    })



  /*
    PHASE 2

    Reasoning
  */


  const reasoning =
    runSpacemonkeyReasoning({

      message,

      context:
        runtime.context

    })



  /*
    PHASE 3

    Decision
  */


  const decision =
    runSpacemonkeyDecision({

      message,

      reasoning

    })



  /*
    PHASE 4

    Planning
  */


  const planning =
    runSpacemonkeyPlannerBridge({

      message,

      decision

    })



  /*
    PHASE 5

    Execution preparation
  */


  const execution =
    runSpacemonkeyExecutionBridge({

      plan:
        planning.planner.plan

    })



  /*
    PHASE 6

    Reflection preparation

    Actual execution is connected later
  */


  const reflection =
    runSpacemonkeyReflection({

      executionResult:
        null,

      expectedOutcome:
        planning.planner.plan.goal.objective

    })



  return {


    success:true,


    agent:
      "spacemonkey",


    pipeline:


    {


      runtime,


      reasoning,


      decision,


      planning,


      execution,


      reflection


    },


    timestamp:
      new Date().toISOString()

  }


}



export {

  runSpacemonkey

}
