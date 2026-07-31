const SPACEMONKEY_API_VERSION =
  "1.0.0"



const REQUEST_TYPES = {


  CHAT:
    "chat",


  ANALYSIS:
    "analysis",


  PLANNING:
    "planning",


  SYSTEM:
    "system"

}



const RESPONSE_STATUS = {


  SUCCESS:
    "success",


  FAILED:
    "failed",


  NEEDS_CONTEXT:
    "needs_context",


  SAFE_MODE:
    "safe_mode"

}



function validateRequest({

  request,

}) {


  if(
    !request
  ){

    return {

      valid:false,

      reason:
        "Request missing"

    }

  }



  if(
    !request.message
  ){

    return {

      valid:false,

      reason:
        "Message missing"

    }

  }



  return {


    valid:true,


    reason:
      "Request valid"

  }


}



function createSpacemonkeyRequest({

  message,

  type =
    REQUEST_TYPES.CHAT,

  context = {},

}) {


  return {


    apiVersion:
      SPACEMONKEY_API_VERSION,


    type,


    message,


    context,


    createdAt:
      new Date().toISOString()


  }


}



function createSpacemonkeyResponse({

  result,

  status =
    RESPONSE_STATUS.SUCCESS

}) {


  return {


    apiVersion:
      SPACEMONKEY_API_VERSION,


    status,


    agent:
      "spacemonkey",


    result,


    generatedAt:
      new Date().toISOString()


  }


}



function createErrorResponse({

  error,

}) {


  return {


    apiVersion:
      SPACEMONKEY_API_VERSION,


    status:
      RESPONSE_STATUS.FAILED,


    agent:
      "spacemonkey",


    error:


    {

      message:
        error.message,


      timestamp:
        new Date().toISOString()

    }

  }


}



function getAPIInformation(){


  return {


    name:
      "Spacemonkey Intelligence API",


    version:
      SPACEMONKEY_API_VERSION,


    requestTypes:
      Object.values(
        REQUEST_TYPES
      ),


    responseStatuses:
      Object.values(
        RESPONSE_STATUS
      )

  }


}



export {

  SPACEMONKEY_API_VERSION,

  REQUEST_TYPES,

  RESPONSE_STATUS,

  validateRequest,

  createSpacemonkeyRequest,

  createSpacemonkeyResponse,

  createErrorResponse,

  getAPIInformation

}
