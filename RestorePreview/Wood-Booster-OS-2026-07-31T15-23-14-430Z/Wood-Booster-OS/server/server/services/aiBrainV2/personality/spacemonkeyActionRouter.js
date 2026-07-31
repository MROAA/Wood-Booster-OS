import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const ACTION_TYPES = {


  ANALYZE:
    "analyze",


  CREATE:
    "create",


  UPDATE:
    "update",


  STORE:
    "store",


  EXECUTE:
    "execute",


  REQUEST_APPROVAL:
    "request_approval"

}



const actionHistory = []



function normalizeTask(task){

  return String(

    task.title ||

    task.description ||

    ""

  )
  .toLowerCase()

}



function detectCapability(task){


  const text =
    normalizeTask(task)



  if(
    text.includes("muisti") ||
    text.includes("memory")
  ){

    return "memory_management"

  }



  if(
    text.includes("tieto") ||
    text.includes("knowledge")
  ){

    return "knowledge_management"

  }



  if(
    text.includes("analysoi") ||
    text.includes("analyze")
  ){

    return "analysis"

  }



  if(
    text.includes("rakenna") ||
    text.includes("create")
  ){

    return "creation"

  }



  return "general_reasoning"

}



function determineActionType({

  capability

}){


  switch(capability){


    case "memory_management":

      return ACTION_TYPES.STORE



    case "knowledge_management":

      return ACTION_TYPES.STORE



    case "creation":

      return ACTION_TYPES.CREATE



    case "analysis":

      return ACTION_TYPES.ANALYZE



    default:

      return ACTION_TYPES.EXECUTE

  }

}



function requiresApproval({

  actionType

}){


  const protectedActions = [

    ACTION_TYPES.UPDATE,

    ACTION_TYPES.EXECUTE

  ]



  return protectedActions.includes(

    actionType

  )

}



function createAction({

  task,

}){


  const capability =
    detectCapability(task)



  const type =
    determineActionType({

      capability

    })



  const action = {


    id:
      `action-${Date.now()}`,


    taskId:
      task.id,


    capability,


    type,


    module:
      null,


    requiresApproval:
      requiresApproval({

        actionType:type

      }),


    status:
      "planned",


    createdAt:
      new Date().toISOString()

  }



  actionHistory.push(action)



  return action

}



function routeTask({

  task,

}){


  const action =
    createAction({

      task

    })



  return {


    success:true,


    route:


    {

      task,

      action

    }

  }


}



function getActionHistory(){


  return [

    ...actionHistory

  ]

}



function getActionRouterStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    totalActions:
      actionHistory.length,


    history:
      actionHistory

  }

}



export {

  ACTION_TYPES,

  routeTask,

  createAction,

  getActionHistory,

  getActionRouterStatus

}
