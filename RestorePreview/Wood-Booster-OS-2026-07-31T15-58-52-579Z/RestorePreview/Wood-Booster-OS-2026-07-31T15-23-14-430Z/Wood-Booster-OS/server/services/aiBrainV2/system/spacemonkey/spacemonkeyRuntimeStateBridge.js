import {
  syncRuntimeFromActivity,
} from "./spacemonkeyRuntimeActivitySync.js"







function createRuntimeStateBridge({

  runtimeActivity,

} = {}){


  if(!runtimeActivity){


    return {

      state:
        "idle",


      status:
        "Spacemonkey odottaa tehtävää.",


      task:
        null,


      action:
        null,


      decision:
        null

    }

  }







  return {


    state:

      runtimeActivity.state,



    status:

      runtimeActivity.status,



    task:

      runtimeActivity.activity?.lastPlan || null,



    action:

      runtimeActivity.activity?.lastAction || null,



    decision:

      runtimeActivity.activity?.lastDecision || null



  }


}







async function getUnifiedRuntimeState({

  prisma,

} = {}){


  const runtimeActivity =

    await syncRuntimeFromActivity({

      prisma

    })





  return createRuntimeStateBridge({

    runtimeActivity

  })

}







export {

  createRuntimeStateBridge,

  getUnifiedRuntimeState

}
