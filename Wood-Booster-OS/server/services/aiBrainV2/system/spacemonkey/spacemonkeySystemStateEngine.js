const stateHistory = []



function createSystemState({

  modules,

  tasks,

  sessions,

  workflows,

  approvals,

  memories,

  improvements

}) {


  const state = {


    status:

      "operational",


    modules:

      normalize(modules),


    development:

    {

      tasks:

        count(tasks),


      sessions:

        count(sessions),


      workflows:

        count(workflows)

    },


    approvals:

      count(approvals),


    memory:

    {

      memories:

        count(memories),


      improvements:

        count(improvements)

    },


    createdAt:

      new Date().toISOString()

  }



  stateHistory.push(

    state

  )



  return state

}





function updateModuleStatus({

  state,

  module,

  status

}) {


  if(

    !state?.modules

  ){

    return state

  }



  const target =

    state.modules.find(

      item =>

        item.name === module

    )



  if(target){

    target.status = status

  }



  return state

}





function count(items){


  if(

    !Array.isArray(items)

  ){

    return 0

  }



  return items.length

}





function normalize(items){


  if(

    !Array.isArray(items)

  ){

    return []

  }



  return items.map(

    item =>

    ({

      name:

        item.name || item,


      status:

        item.status || "active"

    })

  )

}





function getStateHistory(){


  return [

    ...stateHistory

  ]

}





function getCurrentState(){


  return (

    stateHistory[

      stateHistory.length - 1

    ] || null

  )

}





function getSystemStateStatus(){


  return {


    engine:

      "Spacemonkey System State Engine",


    version:

      "0.1.0",


    states:

      stateHistory.length

  }

}



export {

  createSystemState,

  updateModuleStatus,

  getStateHistory,

  getCurrentState,

  getSystemStateStatus

}
