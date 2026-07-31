/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE SUMMARY

Vastuut:

- muodostaa selkeän järjestelmäyhteenvedon
- yhdistää System Pulse tiedot
- tarjoaa frontendille helposti luettavan tilan

Ei:
- suorita toimintoja
- muuta järjestelmää
- tee päätöksiä

=====================================
*/


import {
  getSystemPulse,
} from "./systemPulseService.js"





function getSystemPulseSummary(){

  const pulse =
    getSystemPulse()



  const capability =
    pulse.components.capability


  const runtime =
    pulse.components.runtime


  const modules =
    pulse.components.modules





  return {

    status:
      pulse.status,


    healthy:
      pulse.healthy,


    summary: {

      system:
        pulse.system,


      modules: {

        total:
          modules.total,


        active:
          modules.active,


        status:
          modules.active === modules.total
            ? "healthy"
            : "degraded",

      },


      capability: {

        approved:
          capability.summary.approved,


        blocked:
          capability.summary.blocked,


        approvalRequired:
          capability.summary.approvalRequired,

      },


      runtime: {

        platform:
          runtime.platform,


        nodeVersion:
          runtime.nodeVersion,


        cpuCount:
          runtime.cpuCount,

      },

    },


    checkedAt:
      pulse.checkedAt,

  }

}





export {

  getSystemPulseSummary,

}
