import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



import {
  emit,

  SPACEMONKEY_EVENTS

} from "./spacemonkeyEventBus.js"



const executionHistory = []



const EXECUTION_STATUS = {


  PLANNED:
    "planned",


  RUNNING:
    "running",


  COMPLETED:
    "completed",


  FAILED:
    "failed",


  BLOCKED:
    "blocked"

}



function checkExecutionPermission({

  action,

}) {


  if(
    action.requiresApproval
  ){

    return {


      allowed:false,


      reason:
        "Approval required"

    }

  }



  return {


    allowed:true,


    reason:
      "Execution allowed"

  }

}



async function executeModule({

  module,

  action,

}) {


  return {


    success:true,


    module:


      module.id,


    action:


      action.type,


    message:

      "Module execution completed"

  }

}



async function coordinateExecution({

  action,

  module,

}) {


  const permission =
    checkExecutionPermission({

      action

    })



  const execution = {


    id:
      `execution-${Date.now()}`,


    actionId:
      action.id,


    moduleId:
      module.id,


    status:
      EXECUTION_STATUS.PLANNED,


    startedAt:
      new Date().toISOString()

  }



  if(
    !permission.allowed
  ){


    execution.status =
      EXECUTION_STATUS.BLOCKED



    execution.reason =
      permission.reason



    executionHistory.push(
      execution
    )



    return {


      success:false,


      execution

    }

  }



  execution.status =
    EXECUTION_STATUS.RUNNING



  emit({

    event:
      SPACEMONKEY_EVENTS.ACTION_STARTED,


    payload:
      execution

  })



  try {


    const result =
      await executeModule({

        module,

        action

      })



    execution.status =
      EXECUTION_STATUS.COMPLETED



    execution.result =
      result



    execution.completedAt =
      new Date().toISOString()



    emit({

      event:
        SPACEMONKEY_EVENTS.ACTION_COMPLETED,


      payload:
        execution

    })



    executionHistory.push(

      execution

    )



    return {


      success:true,


      execution

    }



  } catch(error){



    execution.status =
      EXECUTION_STATUS.FAILED



    execution.error =
      error.message



    executionHistory.push(

      execution

    )



    return {


      success:false,


      execution

    }

  }

}



function getExecutionHistory(){


  return [

    ...executionHistory

  ]

}



function getExecutionStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    executions:
      executionHistory

  }

}



export {

  EXECUTION_STATUS,

  coordinateExecution,

  getExecutionHistory,

  getExecutionStatus

}
