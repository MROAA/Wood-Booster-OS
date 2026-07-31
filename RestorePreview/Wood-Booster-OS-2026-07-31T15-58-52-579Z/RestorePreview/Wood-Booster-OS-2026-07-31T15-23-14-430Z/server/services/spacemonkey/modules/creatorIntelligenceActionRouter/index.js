const MODULE_ID = "creator-intelligence-action-router"



const actions = []



const capabilities = [

  "knowledge",

  "development",

  "analysis",

  "communication",

  "system",

]



function routeAction({

  task,

  requiredCapability,

  agent,

  tool,

  riskLevel,

}){


  const capabilityAllowed =
    capabilities.includes(
      requiredCapability
    )



  const action = {

    id:
      `action-${Date.now()}`,


    timestamp:
      new Date().toISOString(),


    task,


    capability:
      requiredCapability,


    agent:
      agent || null,


    tool:
      tool || null,


    riskLevel:
      riskLevel || "low",


    status:

      capabilityAllowed
        ? "queued"
        : "blocked",

  }



  actions.push(action)


  return action

}



function validateAction(action){

  return {

    allowed:
      action.status === "queued"
      &&
      action.riskLevel !== "critical",


    reason:

      action.riskLevel === "critical"
        ? "Requires approval."
        : "Action allowed.",

  }

}



function createExecutionRequest(action){

  const validation =
    validateAction(action)



  return {

    actionId:
      action.id,


    ready:
      validation.allowed,


    status:
      validation.allowed
        ? "ready-for-execution"
        : "awaiting-review",

  }

}



function getActions(){

  return {

    moduleId:
      MODULE_ID,


    count:
      actions.length,


    actions,

  }

}



export {

  MODULE_ID,

  routeAction,

  validateAction,

  createExecutionRequest,

  getActions,

}
