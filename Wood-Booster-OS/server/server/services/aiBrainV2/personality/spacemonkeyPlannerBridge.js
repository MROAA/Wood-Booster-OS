import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



function extractGoal({

  message,

  decision,

}) {


  return {


    objective:
      message,


    decision:


      decision?.decision
        ?.recommendation ||
      "review",


    createdAt:
      new Date().toISOString()

  }


}



function classifyPlanType(message){


  const text =
    String(message || "")
      .toLowerCase()



  if(
    text.includes("rakenna") ||
    text.includes("luo") ||
    text.includes("kehitä")
  ){

    return "build"

  }



  if(
    text.includes("korjaa") ||
    text.includes("debug")
  ){

    return "debug"

  }



  if(
    text.includes("suunnittele")
  ){

    return "strategy"

  }



  return "general"

}



function createPlanSteps({

  planType,

}) {


  const commonSteps = [

    "Understand current situation",

    "Define expected outcome",

    "Identify required resources",

    "Execute controlled steps",

    "Verify result"

  ]



  if(planType === "build"){


    return [

      "Analyze requirements",

      "Design structure",

      "Implement solution",

      "Test functionality",

      "Document result"

    ]

  }



  if(planType === "debug"){


    return [

      "Collect error information",

      "Identify root cause",

      "Apply correction",

      "Test recovery",

      "Record lesson"

    ]

  }



  if(planType === "strategy"){


    return [

      "Analyze current state",

      "Evaluate options",

      "Choose direction",

      "Create roadmap",

      "Review progress"

    ]

  }



  return commonSteps

}



function createSpacemonkeyPlan({

  message,

  decision,

}) {


  const planType =
    classifyPlanType(
      message
    )


  const goal =
    extractGoal({

      message,

      decision

    })


  const steps =
    createPlanSteps({

      planType

    })



  return {


    type:
      planType,


    goal,


    steps,


    status:
      "planned"


  }


}



function runSpacemonkeyPlannerBridge({

  message,

  decision,

}) {


  const core =
    getSpacemonkeyCore()



  const plan =
    createSpacemonkeyPlan({

      message,

      decision

    })



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    planner:


    {

      plan,


      readyForExecution:
        false

    }

  }


}



export {

  runSpacemonkeyPlannerBridge,

  createSpacemonkeyPlan

}
