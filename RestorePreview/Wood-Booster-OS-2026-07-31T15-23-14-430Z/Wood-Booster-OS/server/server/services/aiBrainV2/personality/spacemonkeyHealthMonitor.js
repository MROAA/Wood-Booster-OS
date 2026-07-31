import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



function checkCoreStatus(){


  try {


    const core =
      getSpacemonkeyCore()



    return {


      name:
        core.name,


      version:
        core.version,


      initialized:
        core.initialized,


      status:
        "healthy"


    }


  }


  catch(error){


    return {


      status:
        "failed",


      error:
        error.message


    }


  }


}



function checkCapabilities(){


  const core =
    getSpacemonkeyCore()



  const capabilities =
    core.capabilities || []



  return {


    available:
      capabilities,


    count:
      capabilities.length,


    healthy:
      capabilities.length > 0


  }


}



function checkRuntimeAvailability(){


  return {


    runtime:
      true,


    reasoning:
      true,


    decision:
      true,


    planning:
      true,


    executionBridge:
      true,


    reflection:
      true


  }


}



function calculateSystemStatus({

  core,

  capabilities,

  runtime,

}) {


  if(
    core.status === "failed"
  ){

    return "FAILED"

  }



  if(
    !capabilities.healthy
  ){

    return "DEGRADED"

  }



  return "READY"


}



function runSpacemonkeyHealthCheck(){


  const core =
    checkCoreStatus()



  const capabilities =
    checkCapabilities()



  const runtime =
    checkRuntimeAvailability()



  const status =
    calculateSystemStatus({

      core,

      capabilities,

      runtime

    })



  return {


    agent:
      "spacemonkey",


    status,


    health:


    {

      core,


      capabilities,


      runtime

    },


    checkedAt:
      new Date().toISOString()


  }


}



export {

  runSpacemonkeyHealthCheck,

  checkCoreStatus

}
