/*
==================================================

SPACEMONKEY CORE STATUS SERVICE

Yhdistää Spacemonkeyn ydintilan.

Lähteet:

- Identity
- Safety
- Runtime
- Memory
- Cognitive
- Decision
- Self Model
- World Model
- Activity

Read-only aggregation layer.

==================================================
*/


import {
  getSpacemonkeyGenesisIdentity,
} from "./identity/spacemonkeyGenesisIdentityService.js"



import {
  getSafetyDashboard,
} from "./dashboard/spacemonkeySafetyDashboardService.js"



import {
  getRuntimeState,
} from "./spacemonkeyRuntimeState.js"



import {
  getPersistentMemoryStatus,
} from "./spacemonkeyPersistentMemory.js"



import {
  getCognitiveState,
} from "./spacemonkeyCognitiveStateBridge.js"



import {
  getDecisionState,
} from "./spacemonkeyDecisionStateBridge.js"



import {
  getSelfStatus,
} from "./spacemonkeySelfModel.js"



import {
  getSpacemonkeyWorldStatus,
} from "./spacemonkeyWorldStatusService.js"



import {
  getActivityStatus,
} from "./spacemonkeyActivityService.js"







async function getSpacemonkeyCoreStatus({

  prisma,

} = {}){



  const identity =
    await getSpacemonkeyGenesisIdentity()





  const safety =
    await getSafetyDashboard()





  const runtime =
    getRuntimeState()





  const memory =
    getPersistentMemoryStatus()





  const cognitive =
    await getCognitiveState({

      prisma

    })





  const decision =
    await getDecisionState({

      prisma

    })





  const selfModel =
    getSelfStatus()





  const worldModel =
    await getSpacemonkeyWorldStatus({

      prisma

    })





  const activity =
    await getActivityStatus({

      prisma

    })









  return {


    system:
      "Spacemonkey Core Status",



    version:
      "1.0.0",



    status:
      "active",



    identity:
      identity.identity,



    safety: {

      status:
        safety.status,


      snapshots:
        safety.snapshots.count,


      recovery:
        safety.recovery

    },



    runtime,



    memory,



    cognitive,



    decision,



    selfModel,



    worldModel,



    activity


  }


}







export {

  getSpacemonkeyCoreStatus

}