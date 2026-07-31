/*
==================================================

SPACEMONKEY CONSCIOUSNESS SERVICE

Yhdistää Spacemonkeyn aktiivisen tilan.

Lähteet:

- Runtime State
- Cognitive State
- Decision State
- Activity History

Read-only intelligence view.

==================================================
*/


import {
  getRuntimeState,
} from "./spacemonkeyRuntimeState.js"



import {
  getCognitiveState,
} from "./spacemonkeyCognitiveStateBridge.js"



import {
  getDecisionState,
} from "./spacemonkeyDecisionStateBridge.js"



import {
  getActivityHistory,
} from "./spacemonkeyActivityService.js"







async function getSpacemonkeyConsciousness({

  prisma,

} = {}){


  const runtime =
    getRuntimeState()



  const cognitive =
    await getCognitiveState({

      prisma

    })



  const decision =
    await getDecisionState({

      prisma

    })



  const activity =
    await getActivityHistory({

      prisma

    })







  const latestActivity =
    Array.isArray(activity)
      ? activity[0]
      : null







  return {


    system:
      "Spacemonkey Consciousness View",



    version:
      "1.0.0",



    state:


      cognitive.state || "idle",




    thinking:

      cognitive.thinking || null,



    goal:

      cognitive.goal || null,



    decision: {


      name:
        decision.decision?.name || null,


      risk:
        decision.risk || null,


      truth:

        decision.alignment?.truth || null,


      goalAlignment:

        decision.alignment?.goal || null,


      valueAlignment:

        decision.alignment?.value || null


    },



    runtime: {


      state:
        runtime.state,


      lastAction:
        runtime.activity.lastAction,


      lastDecision:
        runtime.activity.lastDecision,


      lastPlan:
        runtime.activity.lastPlan


    },



    latestActivity,



    nextAction:

      cognitive.nextAction || "Odottaa tehtävää"


  }


}







export {

  getSpacemonkeyConsciousness

}
