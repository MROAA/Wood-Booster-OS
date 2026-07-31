import {
  createTask,
} from "./spacemonkeyTaskIntelligenceEngine.js"


import {
  createExecutionPlan,
} from "./spacemonkeyTaskExecutionPlannerEngine.js"


import {
  createWorkflow,
} from "./spacemonkeyDevelopmentWorkflowEngine.js"


import {
  reviewChange,
} from "./spacemonkeyAutonomousReviewEngine.js"


import {
  makeExecutionDecision,
} from "./spacemonkeyExecutionDecisionEngine.js"


import {
  recordExecutionAudit,
} from "./spacemonkeyExecutionAuditEngine.js"


import {
  createDevelopmentSummary,
} from "./spacemonkeyDevelopmentIntelligenceSummaryEngine.js"



const orchestratorHistory = []



function runDevelopmentFlow({

  message,

  codingContext,

  codeChangePlan,

  codeInspection,

  approval

}) {


  const task =

    createTask({

      message,

      codingContext,

      codeChangePlan

    })



  const executionPlan =

    createExecutionPlan({

      task

    })



  const workflow =

    createWorkflow({

      task,

      executionPlan

    })



  const review =

    reviewChange({

      fileInspection:

        codeInspection,


      codeChangePlan,


      approval,


      workflow

    })



  const decision =

    makeExecutionDecision({

      review,

      approval,

      task

    })



  const audit =

    recordExecutionAudit({

      task,

      decision,

      result:

      {

        status:

          decision.action

      }

    })



  const summary =

    createDevelopmentSummary({

      projectName:

        "Wood-Booster OS",


      tasks:

      [

        task

      ],


      workflows:

      [

        workflow

      ],


      decisions:

      [

        decision

      ],


      audits:

      [

        audit

      ]

    })



  const result = {


    status:

      "completed",


    task,


    executionPlan,


    workflow,


    review,


    decision,


    audit,


    summary,


    createdAt:

      new Date().toISOString()

  }



  orchestratorHistory.push(

    result

  )



  return result

}





function getOrchestratorHistory(){

  return [

    ...orchestratorHistory

  ]

}





function getDevelopmentOrchestratorStatus(){


  return {


    engine:

      "Spacemonkey Development Orchestrator",


    version:

      "0.1.0",


    executions:

      orchestratorHistory.length

  }

}



export {

  runDevelopmentFlow,

  getOrchestratorHistory,

  getDevelopmentOrchestratorStatus

}
