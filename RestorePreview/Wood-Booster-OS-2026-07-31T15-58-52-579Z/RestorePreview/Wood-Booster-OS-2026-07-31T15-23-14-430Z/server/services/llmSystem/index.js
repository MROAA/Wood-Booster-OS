import {
  loadModules
} from "./modules/moduleLoader.js"



import {
  getModuleList,
  checkAllHealth
} from "./modules/moduleRegistry.js"



import {
  runLLMOrchestrator
} from "./core/llmOrchestrator.js"



import {
  registerSecurityRule,
  createDefaultSecurityRules
} from "./security/llmSecurityGateway.js"





let initialized = false







async function initializeLLMSystem({

  modules = []

} = {}) {



  if(
    initialized
  ){

    return {

      success:true,

      status:
        "already_initialized"

    }

  }



  const securityRules =
    createDefaultSecurityRules()



  for(
    const rule
    of securityRules
  ){

    registerSecurityRule(
      rule
    )

  }



  const moduleResults =
    await loadModules(
      modules
    )



  initialized = true



  return {

    success:true,

    status:
      "initialized",

    modules:
      moduleResults

  }


}







async function runLLMRequest({

  message,

  llmProvider,

  context = {}

}) {


  return await runLLMOrchestrator({

    message,

    llmProvider,

    context

  })


}







function getLLMSystemStatus(){


  return {

    initialized,

    modules:
      getModuleList()

  }


}







async function getLLMSystemHealth(){


  return {

    status:
      "READY",

    modules:
      await checkAllHealth()

  }


}







export {

  initializeLLMSystem,

  runLLMRequest,

  getLLMSystemStatus,

  getLLMSystemHealth

}
