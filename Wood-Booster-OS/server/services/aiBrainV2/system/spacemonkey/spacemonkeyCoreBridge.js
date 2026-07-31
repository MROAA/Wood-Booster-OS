import {
  loadSpacemonkeyCore,
  getActiveModules,
  getCoreStatus,
} from "../../../../../Spacemonkey/core/spacemonkeyCoreLoader.js"





const bridgeHistory = []





function getSpacemonkeyCore(){


  const core =

    loadSpacemonkeyCore()



  const result = {


    system:

      core.system,


    version:

      core.version,


    identity:

      core.godFiles,


    modules:

      getActiveModules(),


    runtime:

      core.runtime,


    loadedAt:

      core.loadedAt

  }





  bridgeHistory.push(
    result
  )





  return result

}







function getSpacemonkeyModules(){


  return getActiveModules()

}







function getSpacemonkeyRuntime(){


  const core =

    getSpacemonkeyCore()



  return core.runtime

}







function getSpacemonkeyBridgeStatus(){


  return {


    engine:

      "Spacemonkey Core Bridge",


    version:

      "1.0.1",


    core:

      getCoreStatus(),


    requests:

      bridgeHistory.length

  }

}







function getBridgeHistory(){


  return [

    ...bridgeHistory

  ]

}







export {

  getSpacemonkeyCore,

  getSpacemonkeyModules,

  getSpacemonkeyRuntime,

  getSpacemonkeyBridgeStatus,

  getBridgeHistory

}
