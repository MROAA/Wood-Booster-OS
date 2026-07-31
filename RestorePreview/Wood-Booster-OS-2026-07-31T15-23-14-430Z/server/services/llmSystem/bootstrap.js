import {
  initializeLLMSystem,
  getLLMSystemHealth,
  getLLMSystemStatus
} from "./index.js"



import {
  getSystemModules
} from "./modules/index.js"





let started = false







async function startLLMSystem(){


  if(
    started
  ){

    return {

      success:true,

      status:
        "already_started"

    }

  }




  const modules =
    getSystemModules()



  const result =
    await initializeLLMSystem({

      modules

    })



  started = true



  return {

    success:
      result.success,

    status:
      "started",

    modules:
      result.modules

  }


}







async function getBootstrapStatus(){


  return {

    started,

    system:
      getLLMSystemStatus(),

    health:
      await getLLMSystemHealth()

  }


}







export {

  startLLMSystem,

  getBootstrapStatus

}
