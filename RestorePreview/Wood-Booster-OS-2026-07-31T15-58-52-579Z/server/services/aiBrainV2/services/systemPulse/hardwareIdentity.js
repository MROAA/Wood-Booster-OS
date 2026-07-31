/*
=====================================

WOOD-BOOSTER AI BRAIN V2

HARDWARE IDENTITY

Vastuut:

- tunnistaa koneen laitteiston
- yhdistää CPU, RAM ja GPU tiedot
- tarjoaa hardware awareness tiedot System Pulseen

Ei:
- muuta järjestelmää
- suorita AI-tehtäviä
- tee päätöksiä

=====================================
*/


import os from "os"

import {
  getGpuIdentity,
} from "./gpuIdentity.js"





function getCpuInfo(){

  const cpus =
    os.cpus()



  return {

    model:
      cpus[0]?.model ||
      "unknown",


    cores:
      cpus.length,

  }

}





function getMemoryInfo(){

  const total =
    os.totalmem()


  const free =
    os.freemem()


  const used =
    total - free



  return {

    totalBytes:
      total,


    freeBytes:
      free,


    usedPercent:
      Math.round(
        (used / total) * 100,
      ),

  }

}





function getHardwareIdentity(){

  return {

    host:
      os.hostname(),


    cpu:
      getCpuInfo(),


    memory:
      getMemoryInfo(),


    gpu:
      getGpuIdentity(),


    architecture:
      os.arch(),


    checkedAt:
      new Date()
        .toISOString(),

  }

}





export {

  getHardwareIdentity,

}
