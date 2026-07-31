import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



function validateExecutionRequest({

  plan,

}) {


  if(!plan){

    return {

      allowed:false,

      reason:
        "Missing execution plan"

    }

  }



  if(
    !Array.isArray(plan.steps) ||
    plan.steps.length === 0
  ){

    return {

      allowed:false,

      reason:
        "Plan contains no executable steps"

    }

  }



  return {

    allowed:true,

    reason:
      "Plan is valid for execution preparation"

  }


}



function createExecutionRequest({

  plan,

}) {


  return {


    type:
      "spacemonkey_execution_request",


    status:
      "awaiting_approval",


    objective:
      plan.goal.objective,


    steps:
      plan.steps,


    createdAt:
      new Date().toISOString()


  }


}



function createVerificationPlan({

  plan,

}) {


  return {


    verify:


    [

      "Check expected outcome",

      "Confirm system stability",

      "Record result",

      "Extract learning"

    ],


    source:
      plan.goal.objective


  }


}



function runSpacemonkeyExecutionBridge({

  plan,

}) {


  const core =
    getSpacemonkeyCore()



  const validation =
    validateExecutionRequest({

      plan

    })



  if(!validation.allowed){


    return {


      agent:
        "spacemonkey",


      execution:


      {

        status:
          "blocked",


        validation

      }

    }

  }



  const executionRequest =
    createExecutionRequest({

      plan

    })



  const verification =
    createVerificationPlan({

      plan

    })



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    execution:


    {

      validation,


      request:
        executionRequest,


      verification,


      ready:
        true

    }

  }


}



export {

  runSpacemonkeyExecutionBridge,

  validateExecutionRequest

}
