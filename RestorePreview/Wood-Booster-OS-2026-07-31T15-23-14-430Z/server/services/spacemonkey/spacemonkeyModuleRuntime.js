/*
=====================================

SPACEMONKEY MODULE RUNTIME

Hallinnoi moduulin elinkaarta.

Ei suorita moduulia.

Vain tila.

=====================================
*/


const runtimeStates = {}







function createModuleRuntime(moduleId){


  const runtime = {


    id:

      moduleId,


    state:

      "created",


    createdAt:

      new Date().toISOString()


  }





  runtimeStates[moduleId] = runtime





  return runtime


}







function setModuleRuntimeState(

  moduleId,

  state

){


  if(!runtimeStates[moduleId]){


    return {


      success:false,


      error:"Module runtime not found"


    }

  }





  runtimeStates[moduleId].state = state



  runtimeStates[moduleId].updatedAt =

    new Date().toISOString()





  return {


    success:true,


    runtime:

      runtimeStates[moduleId]


  }


}







function getModuleRuntime(moduleId){


  return runtimeStates[moduleId] || null


}







function getAllModuleRuntime(){


  return Object.values(

    runtimeStates

  )


}







export {

  createModuleRuntime,

  setModuleRuntimeState,

  getModuleRuntime,

  getAllModuleRuntime

}
