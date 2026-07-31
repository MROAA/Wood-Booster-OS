/*
=====================================

WOOD-BOOSTER AI BRAIN V2

GPU IDENTITY

Vastuut:

- tunnistaa järjestelmän GPU-laitteet
- muuttaa tiedot luettavaan muotoon
- tarjoaa GPU awareness tiedot System Pulseen

Ei:
- suorita laskentaa
- muuta ajureita
- tee päätöksiä

=====================================
*/


import fs from "fs"

import {
  normalizeGpuList,
} from "./gpuNormalizer.js"





function readFileSafe(path){

  try {

    return fs.readFileSync(
      path,
      "utf-8",
    )

  } catch {

    return ""

  }

}





function parsePciDevices(){

  const pciDevices =
    readFileSafe(
      "/proc/bus/pci/devices",
    )



  if(!pciDevices){

    return []

  }



  return pciDevices
    .split("\n")
    .filter(Boolean)

}





function detectRawGpuDevices(){

  const devices =
    parsePciDevices()



  return devices.filter(
    (device) => {

      const value =
        device.toLowerCase()


      return (

        value.includes("nvidia") ||

        value.includes("amd") ||

        value.includes("ati") ||

        value.includes("radeon")

      )

    },
  )

}





function getGpuIdentity(){

  const rawDevices =
    detectRawGpuDevices()



  const gpus =
    normalizeGpuList(
      rawDevices,
    )



  return {

    count:
      gpus.length,


    gpus,


    checkedAt:
      new Date()
        .toISOString(),

  }

}





export {

  getGpuIdentity,

}
