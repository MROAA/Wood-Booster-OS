import {
  getUnifiedRuntimeState,
} from "./spacemonkeyRuntimeStateBridge.js"







function createCognitiveState({

  runtimeState,

} = {}){


  if(!runtimeState){


    return {

      state:
        "idle",


      thinking:
        null,


      goal:
        null,


      decision:
        null,


      nextAction:
        null

    }

  }







  return {


    state:

      runtimeState.state || "idle",



    thinking:

      runtimeState.decision?.name || null,



    goal:

      runtimeState.task || null,



    decision:

      runtimeState.decision || null,



    nextAction:

      getNextAction(

        runtimeState.state

      )



  }

}







function getNextAction(

  state

){


  switch(state){


    case "planning":

      return "Toteuta suunnitelman seuraava vaihe"



    case "decision":

      return "Arvioi vaihtoehdot"



    case "completed":

      return "Tarkista tulos"



    case "thinking":

      return "Muodosta ratkaisu"



    default:

      return "Odottaa tehtävää"

  }

}







async function getCognitiveState({

  prisma,

} = {}){


  const runtimeState =

    await getUnifiedRuntimeState({

      prisma

    })





  return createCognitiveState({

    runtimeState

  })

}







export {

  createCognitiveState,

  getCognitiveState

}
