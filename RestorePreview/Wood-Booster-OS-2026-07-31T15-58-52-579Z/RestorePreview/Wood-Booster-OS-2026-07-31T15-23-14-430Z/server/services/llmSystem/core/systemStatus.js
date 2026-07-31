import {
  getSystemModules
} from "./systemRegistry.js"



import {
  getAllLifecycleStates
} from "./lifecycleManager.js"







function calculateSystemStatus(modules){


  if(
    modules.length === 0
  ){

    return "EMPTY"

  }





  const hasError =
    modules.some(
      module =>
        module.status === "ERROR"
    )



  if(
    hasError
  ){

    return "ERROR"

  }





  const allReady =
    modules.every(
      module =>
        module.status === "READY"
    )



  if(
    allReady
  ){

    return "READY"

  }





  return "STARTING"


}







function getSystemStatus(){


  const modules =
    getSystemModules()



  const lifecycle =
    getAllLifecycleStates()





  return {

    system:
      "Wood-Booster AI Platform",


    status:
      calculateSystemStatus(
        modules
      ),


    timestamp:
      new Date()
        .toISOString(),


    modules,


    lifecycle

  }


}







export {

  getSystemStatus

}
