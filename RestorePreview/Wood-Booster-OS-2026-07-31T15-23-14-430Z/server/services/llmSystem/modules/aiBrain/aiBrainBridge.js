let aiBrainExecutor = null





function connectAIBrain(executor){

  if(
    typeof executor !== "function"
  ){

    throw new Error(
      "AI Brain executor must be a function"
    )

  }



  aiBrainExecutor = executor



}







function isConnected(){


  return Boolean(
    aiBrainExecutor
  )


}







async function executeAIBrainRequest({

  message,

  context = {}

}) {


  if(
    !aiBrainExecutor
  ){

    return {

      success:false,

      status:
        "not_connected",

      message:
        "AI Brain V2 bridge is not connected yet."

    }

  }





  try {


    const result =
      await aiBrainExecutor({

        message,

        context

      })



    return {

      success:true,

      status:
        "completed",

      result

    }


  }

  catch(error){


    return {

      success:false,

      status:
        "error",

      error:
        error.message

    }


  }


}







function getBridgeStatus(){


  return {

    connected:
      isConnected(),

    target:
      "AI Brain V2"

  }


}







export {

  connectAIBrain,

  executeAIBrainRequest,

  getBridgeStatus,

  isConnected

}
