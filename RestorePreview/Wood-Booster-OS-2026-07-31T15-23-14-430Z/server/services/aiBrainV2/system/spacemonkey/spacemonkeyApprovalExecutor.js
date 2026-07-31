import {
  getCurrentApproval,
} from "./spacemonkeyChangeApproval.js"


import {
  executeCodeChange,
} from "./spacemonkeyExecutionController.js"


import {
  recordActivity,
} from "./spacemonkeyActivityFeedEngine.js"



const executionHistory = []





async function executeApprovedChange({

  prisma,

  content

}) {


  const approval =
    await getCurrentApproval({

      prisma

    })



  if(
    !approval ||
    approval.approved !== true
  ){

    return {

      success:false,

      status:
        "blocked",

      reason:
        "No approved change available."

    }

  }





  const result =

    await executeCodeChange({

      filePath:
        approval.filePath,

      content,

      approval

    })





  await recordActivity({

    prisma,

    type:
      "approved_change_execution",

    module:
      "Approval Executor",

    status:
      result.status,

    message:
      `Approved change execution ${result.status}`,

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





function getApprovalExecutorStatus(){


  return {


    engine:
      "Spacemonkey Approval Executor",


    version:
      "0.2.0",


    executions:
      executionHistory.length

  }

}





export {

  executeApprovedChange,

  getExecutionHistory,

  getApprovalExecutorStatus

}
