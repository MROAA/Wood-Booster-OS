import {
  getIdentity,
} from "./spacemonkeyIdentityBridge.js"


import {
  getValues,
} from "./spacemonkeyValuesBridge.js"


import {
  createRuntimeState,
} from "./spacemonkeyRuntimeController.js"


import {
  getCoreStatus,
} from "./spacemonkeyCoreLoader.js"


import {
  getMemoryBridgeStatus,
} from "./spacemonkeyMemoryBridge.js"





const apiHistory = []





function getCoreAPIStatus(){


  const identity =
    getIdentity()



  const values =
    getValues()



  const runtime =
    createRuntimeState()



  const core =
    getCoreStatus()



  const memory =
    getMemoryBridgeStatus()





  const result = {


    system:

      "Spacemonkey Core API",



    version:

      "1.1.0",



    status:

      "active",



    identity,


    values,


    runtime,


    memory,


    core,



    createdAt:

      new Date().toISOString()

  }





  apiHistory.push(

    result

  )





  return result

}







function getAPIHistory(){


  return [

    ...apiHistory

  ]

}







export {

  getCoreAPIStatus,

  getAPIHistory

}
