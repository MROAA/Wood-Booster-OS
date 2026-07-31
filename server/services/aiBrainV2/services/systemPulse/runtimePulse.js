/*
=====================================

WOOD-BOOSTER AI BRAIN V2

RUNTIME PULSE

Vastuut:

- lukee käyttöympäristön tilan
- kertoo runtime-tiedot System Pulseen

Ei:
- muuta järjestelmää
- suorita komentoja
- kirjoita dataa

=====================================
*/


import os from "os"



function getRuntimePulse(){

  return {

    platform:
      process.platform,


    nodeVersion:
      process.version,


    architecture:
      process.arch,


    hostname:
      os.hostname(),


    cpuCount:
      os.cpus().length,


    memory:{

      total:
        os.totalmem(),

      free:
        os.freemem(),

    },


    uptime:

      process.uptime(),


    checkedAt:
      new Date()
        .toISOString(),

  }

}





export {

  getRuntimePulse,

}
