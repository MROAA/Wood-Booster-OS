import {
  updateRuntimeState,
  getRuntimeState,
} from "./spacemonkeyRuntimeState.js"





const connectorHistory = []







function updateSpacemonkeyRuntime({

  action = null,

  decision = null,

  plan = null,

  status = "idle"

} = {}) {



  const state =

    updateRuntimeState({

      status,

      action,

      decision,

      plan

    })





  const result = {


    system:

      "Spacemonkey Runtime Connector",



    action:

      "runtime_update",



    state,



    createdAt:

      new Date().toISOString()

  }





  connectorHistory.push(

    result

  )





  return result

}







function getSpacemonkeyRuntime(){


  return {


    system:

      "Spacemonkey Runtime Connector",



    runtime:

      getRuntimeState(),



    createdAt:

      new Date().toISOString()

  }

}







function getRuntimeConnectorHistory(){


  return [

    ...connectorHistory

  ]

}







function getRuntimeConnectorStatus(){


  return {


    engine:

      "Spacemonkey Runtime Connector",



    version:

      "1.0.0",



    updates:

      connectorHistory.length

  }

}







export {

  updateSpacemonkeyRuntime,

  getSpacemonkeyRuntime,

  getRuntimeConnectorHistory,

  getRuntimeConnectorStatus

}
