import {
  recordActivity,
} from "./spacemonkeyActivityFeedEngine.js"



const simulationHistory = []



async function simulateCodeExecution({

  prisma,

  filePath,

  proposal,

  validation,

  testPlan

}) {


  const simulation = {


    status:
      "simulation_completed",


    filePath:
      filePath || null,


    checks:

    {

      fileAvailable:
        Boolean(filePath),


      proposalAvailable:
        Boolean(proposal),


      validationAvailable:
        Boolean(validation),


      testPlanAvailable:
        Boolean(testPlan)

    },


    result:

      determineResult({

        proposal,

        validation,

        testPlan

      }),


    nextStep:

      "await_final_approval",


    createdAt:

      new Date().toISOString()

  }



  await recordActivity({

    prisma,


    type:

      "code_execution_simulated",


    module:

      "Code Execution Simulator",


    status:

      "completed",


    message:

      `Execution simulation completed for ${filePath || "unknown file"}`

  })



  simulationHistory.push(

    simulation

  )



  return simulation

}





function determineResult({

  proposal,

  validation,

  testPlan

}) {


  if(

    !proposal ||

    !validation ||

    !testPlan

  ){

    return "blocked"

  }



  return "ready_for_review"

}





function getExecutionSimulatorStatus(){


  return {


    engine:

      "Spacemonkey Code Execution Simulator",


    version:

      "0.2.0",


    simulations:

      simulationHistory.length

  }

}



export {

  simulateCodeExecution,

  getExecutionSimulatorStatus

}
