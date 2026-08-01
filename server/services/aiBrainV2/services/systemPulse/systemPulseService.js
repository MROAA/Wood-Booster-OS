/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE SERVICE

Vastuut:

- kokoaa AI Brain tilan
- kokoaa runtime tiedot
- kokoaa käyttöjärjestelmä tiedot
- kokoaa moduulitiedot
- kokoaa laitteistotiedot
- kokoaa Git tilan
- kokoaa Git Sync tilan
- kokoaa Git Watcher tilan
- kokoaa Git historian
- kokoaa Git Summaryn
- kokoaa Security Monitor tilan

=====================================
*/


import {
  ensureDefaultBrainModules,
} from "../../index.js"



import {
  getCapabilityHealth,
} from "../capabilityExecution/capabilityHealth.js"



import {
  getRuntimePulse,
} from "./runtimePulse.js"



import {
  getRuntimeIdentity,
} from "./runtimeIdentity.js"



import {
  getModulePulse,
} from "./modulePulse.js"



import {
  getHardwareIdentity,
} from "./hardwareIdentity.js"



import {
  getGitIdentity,
} from "./gitIdentity.js"



import {
  getGitSyncStatus,
} from "./gitSyncMonitor.js"



import {
  getGitSyncWatcherStatus,
} from "./gitSyncWatcher.js"



import {
  getGitSyncHistory,
} from "./gitSyncHistory.js"



import {
  getGitSyncSummary,
} from "./gitSyncSummary.js"



import {
  getSecurityPulseStatus,
  getSecurityHealth,
} from "./securityMonitor.js"







async function getSystemPulse(){


  ensureDefaultBrainModules()





  const capability =
    getCapabilityHealth()



  const runtime =
    getRuntimePulse()



  const identity =
    getRuntimeIdentity()



  const modules =
    getModulePulse()



  const hardware =
    getHardwareIdentity()



  const git =
    getGitIdentity()



  const gitSync =
    getGitSyncStatus()



  const gitWatcher =
    getGitSyncWatcherStatus()



  const gitHistory =
    await getGitSyncHistory()



  const gitSummary =
    await getGitSyncSummary()



  const security =
    getSecurityPulseStatus()



  const securityHealth =
    getSecurityHealth()






  const healthy =
    capability.healthy &&
    modules.active >= 0 &&
    securityHealth.healthy







  return {


    system:
      "Wood-Booster AI Brain V2",



    status:
      healthy
        ? "healthy"
        : "degraded",



    healthy,





    components: {


      capability,


      runtime,


      identity,


      hardware,


      modules,


      git,


      gitSync,


      gitWatcher,


      gitHistory,


      gitSummary,


      security,


      securityHealth,


    },





    checkedAt:
      new Date()
        .toISOString(),


  }


}







export {

  getSystemPulse,

}
