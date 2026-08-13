import {
  loadSpacemonkeyCore,
} from "./spacemonkeyCoreLoader.js"


import {
  getEnabledModules,
} from "./spacemonkeyModuleResolver.js"





const runtimeHistory = []







function getRuntimeConfig(){


  const core =

    loadSpacemonkeyCore()



  return (

    core?.runtime

    ||

    {}

  )

}







function getRuntimeModules(){


  return getEnabledModules()

}







function createRuntimeState(){


  const runtime =

    getRuntimeConfig()



  const modules =

    getRuntimeModules()





  const state = {


    system:

      "Spacemonkey Runtime Controller",


    status:

      "active",


    mode:

      runtime
        ?.environment
        ?.mode

      ||

      "unknown",


    safeMode:

      runtime
        ?.execution
        ?.safeMode

      ??

      true,


    autonomousActions:

      runtime
        ?.execution
        ?.autonomousActions

      ??

      false,


    modules:

      {

        count:

          modules.length,


        active:

          modules.map(

            module =>

              module.id

          )

      },


    rules:

      runtime.rules

      ||

      {},


    createdAt:

      new Date().toISOString()

  }





  runtimeHistory.push(
    state
  )





  return state

}







function isModuleActive(moduleId){


  const modules =

    getRuntimeModules()



  return modules.some(

    module =>

      module.id === moduleId

  )

}







function canExecute(action){


  const runtime =

    getRuntimeConfig()



  const blockedActions =

    runtime
      ?.execution
      ?.requireConfirmation

    ||

    []





  return !blockedActions.includes(
    action
  )

}







function getRuntimeStatus(){


  return {


    engine:

      "Spacemonkey Runtime Controller",


    version:

      "1.0.0",


    history:

      runtimeHistory.length,


    modules:

      getRuntimeModules().length

  }

}







function getRuntimeHistory(){

  return [

    ...runtimeHistory

  ]

}







export {

  getRuntimeConfig,

  getRuntimeModules,

  createRuntimeState,

  isModuleActive,

  canExecute,

  getRuntimeStatus,

  getRuntimeHistory

}
