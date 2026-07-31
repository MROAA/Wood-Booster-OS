/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE STATE

Vastuut:

- muodostaa käyttöliittymäystävällisen tilan
- yhdistää System Pulse tiedot
- tarjoaa selkeän järjestelmätilan

Ei:
- suorita moduuleja
- muuta järjestelmää
- tee päätöksiä

=====================================
*/


import {
  getSystemPulse,
} from "./systemPulseService.js"







async function getSystemPulseState(){


  const pulse =
    await getSystemPulse()





  const capability =
    pulse.components.capability



  const identity =
    pulse.components.identity



  const runtime =
    pulse.components.runtime



  const modules =
    pulse.components.modules





  return {


    status:
      pulse.status,



    healthy:
      pulse.healthy,



    environment: {


      operatingSystem:
        identity.operatingSystem.distribution,



      platform:
        identity.operatingSystem.platform,



      kernel:
        identity.kernel,



      architecture:
        identity.architecture,



      hostname:
        identity.hostname,


    },





    brain: {


      modules:
        modules.total,



      activeModules:
        modules.active,


    },





    security: {


      capabilitiesApproved:
        capability.summary.approved,



      capabilitiesBlocked:
        capability.summary.blocked,



      approvalRequired:
        capability.summary.approvalRequired,


    },





    runtime: {


      nodeVersion:
        runtime.nodeVersion,



      cpuCount:
        runtime.cpuCount,


    },





    hardware:
      pulse.components.hardware,





    git:
      pulse.components.git,





    gitSync:
      pulse.components.gitSync,





    gitWatcher:
      pulse.components.gitWatcher,





    gitHistory:
      pulse.components.gitHistory,





    gitSummary:
      pulse.components.gitSummary,





    checkedAt:
      pulse.checkedAt,


  }


}







export {

  getSystemPulseState,

}
