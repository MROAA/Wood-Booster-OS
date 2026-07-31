const runtimeHistory = []





let runtimeState = {


  status:

    "idle",



  activity:

  {

    lastAction:

      null,


    lastDecision:

      null,


    lastPlan:

      null

  },



  startedAt:

    new Date().toISOString()

}







function getRuntimeState(){


  return {


    system:

      "Spacemonkey Runtime State",



    version:

      "1.0.0",



    state:

      runtimeState.status,



    activity:

      runtimeState.activity,



    startedAt:

      runtimeState.startedAt,



    updatedAt:

      new Date().toISOString()

  }

}







function updateRuntimeState({

  status = "idle",

  action = null,

  decision = null,

  plan = null

} = {}) {



  runtimeState = {


    ...runtimeState,



    status,



    activity:

    {

      lastAction:

        action,



      lastDecision:

        decision,



      lastPlan:

        plan

    }

  }





  const snapshot =

    getRuntimeState()





  runtimeHistory.push(

    snapshot

  )





  return snapshot

}







function getRuntimeHistory(){


  return [

    ...runtimeHistory

  ]

}







function getRuntimeStatus(){


  return {


    engine:

      "Spacemonkey Runtime State",



    version:

      "1.0.0",



    history:

      runtimeHistory.length

  }

}







export {

  getRuntimeState,

  updateRuntimeState,

  getRuntimeHistory,

  getRuntimeStatus

}
