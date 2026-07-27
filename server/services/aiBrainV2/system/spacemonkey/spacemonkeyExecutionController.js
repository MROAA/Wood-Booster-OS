import {
  writeCodeChange,
} from "./spacemonkeyCodeWriter.js"



import {
  recordActivity,
} from "./spacemonkeyActivityFeedEngine.js"



const executionHistory = []





async function executeCodeChange({

  prisma,

  filePath,

  content,

  approval

}) {


  if(

    !approval ||

    approval.approved !== true

  ){

    const blocked = {


      success:false,


      status:
        "blocked",


      reason:
        "Approval required.",


      nextStep:
        "await_approval",


      createdAt:
        new Date().toISOString()

    }



    executionHistory.push(

      blocked

    )



    return blocked

  }





  await recordActivity({

    prisma,

    type:
      "execution_started",

    module:
      "Execution Controller",

    status:
      "started",

    message:
      `Execution started for ${filePath}`

  })





  const writer =

    await writeCodeChange({

      filePath,

      content,

      mode:
        "safe_write"

    })





  const result = {


    success:
      writer.status === "written",


    status:
      writer.status === "written"

        ? "execution_completed"

        : "execution_failed",


    filePath,


    writer,


    nextStep:
      writer.status === "written"

        ? "review_result"

        : "repair_required",


    createdAt:
      new Date().toISOString()

  }





  await recordActivity({

    prisma,

    type:
      "execution_completed",

    module:
      "Execution Controller",

    status:
      result.status,

    message:
      `Execution ${result.status} for ${filePath}`,

    metadata:
      JSON.stringify(result)

  })





  executionHistory.push(

    result

  )



  return result

}







function getExecutionHistory(){


  return [

    ...executionHistory

  ]

}







function getExecutionControllerStatus(){


  return {


    engine:

      "Spacemonkey Execution Controller",


    version:

      "0.4.0",


    executions:

      executionHistory.length

  }

}







export {

  executeCodeChange,

  getExecutionHistory,

  getExecutionControllerStatus

}
