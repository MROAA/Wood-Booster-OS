const MODULE_ID = "creator-intelligence-api-gateway"



const requestHistory = []



const availableActions = [

  "get-context",

  "get-status",

  "get-health",

  "get-diagnostics",

  "request-export",

]



function handleRequest({

  requester,

  action,

  payload,

}){

  if (
    !availableActions.includes(action)
  ){

    return {

      success:
        false,

      reason:
        "Unsupported action.",

    }

  }



  const request = {

    id:
      `creator-api-request-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    requester,

    action,

    payload:

      payload || null,


    status:
      "accepted",

  }



  requestHistory.push(request)



  return {

    success:
      true,

    request,

  }

}



function getAvailableActions(){

  return {

    moduleId:
      MODULE_ID,

    actions:
      availableActions,

  }

}



function getRequestHistory(){

  return {

    moduleId:
      MODULE_ID,

    count:
      requestHistory.length,

    requests:
      requestHistory,

  }

}



function getLatestRequests(){

  return requestHistory.slice(-10)

}



export {

  MODULE_ID,

  handleRequest,

  getAvailableActions,

  getRequestHistory,

  getLatestRequests,

}
