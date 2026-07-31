import {
  getCognitiveState,
} from "./spacemonkeyCognitiveStateBridge.js"







function createDecisionState({

  cognitiveState,

} = {}){


  if(!cognitiveState){


    return {

      state:
        "unknown",


      recommendation:
        "Spacemonkey odottaa lisää tietoa.",


      decision:
        null,


      risk:
        null,


      alignment:
        null

    }

  }







  const decision =

    cognitiveState.decision







  return {


    state:

      cognitiveState.state || "unknown",



    recommendation:

      cognitiveState.nextAction || 
      "Odottaa seuraavaa vaihetta",



    decision,



    risk:

      decision?.risk ?? null,



    alignment:

    {

      goal:

        decision?.goalAlignment ?? null,


      value:

        decision?.valueAlignment ?? null,


      truth:

        decision?.truthScore ?? null

    }

  }

}







async function getDecisionState({

  prisma,

} = {}){


  const cognitiveState =

    await getCognitiveState({

      prisma

    })





  return createDecisionState({

    cognitiveState

  })

}







export {

  createDecisionState,

  getDecisionState

}
