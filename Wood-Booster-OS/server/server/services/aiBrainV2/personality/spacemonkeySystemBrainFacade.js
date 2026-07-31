import {
  runAutonomousCycle,
} from "./spacemonkeyAutonomousCycleController.js"


import {
  runSpacemonkeyDiagnostics,
} from "./spacemonkeyDiagnostics.js"


import {
  validateIdentity,
} from "./spacemonkeyIdentityGuard.js"



import {
  getMissionStatus,
} from "./spacemonkeyMissionController.js"



const brainHistory = []



function createBrainRequest({

  message,

  context = {}

}) {


  return {


    id:
      `brain-${Date.now()}`,


    message,


    context,


    createdAt:
      new Date().toISOString()

  }

}



async function process({

  message,

  memory = [],

  knowledge = [],

  goals = [],

  state = {}

}) {


  const request =
    createBrainRequest({

      message,

      context:
      {

        memoryCount:
          memory.length,


        knowledgeCount:
          knowledge.length

      }

    })



  const identity =
    validateIdentity()



  if(
    !identity.identityValid
  ){

    return {


      success:false,


      error:
        "Identity validation failed"

    }

  }



  const cycle =
    await runAutonomousCycle({

      message,

      memory,

      knowledge,

      goals,

      state

    })



  const result = {


    success:true,


    agent:
      "spacemonkey",


    request,


    mission:
      getMissionStatus(),


    diagnostics:
      runSpacemonkeyDiagnostics(),


    cycle

  }



  brainHistory.push(

    result

  )



  return result

}



function getBrainHistory(){


  return [

    ...brainHistory

  ]

}



function getBrainStatus(){


  return {


    agent:
      "spacemonkey",


    requests:
      brainHistory.length,


    lastRequest:

      brainHistory.at(-1) || null

  }

}



export {

  process,

  getBrainHistory,

  getBrainStatus

}
