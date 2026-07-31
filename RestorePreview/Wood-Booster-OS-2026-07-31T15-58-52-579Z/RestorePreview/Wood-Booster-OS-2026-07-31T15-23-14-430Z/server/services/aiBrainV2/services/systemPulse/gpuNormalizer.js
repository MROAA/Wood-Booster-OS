/*
=====================================

WOOD-BOOSTER AI BRAIN V2

GPU NORMALIZER

Vastuut:

- muuttaa PCI GPU datan selkeään muotoon
- piilottaa raakadatakerroksen

=====================================
*/


function normalizeGpuDevice(
  device,
){

  const value =
    String(
      device || "",
    )
    .toLowerCase()



  let vendor =
    "unknown"


  let driver =
    "unknown"



  if(
    value.includes("nvidia")
  ){

    vendor =
      "NVIDIA"


    driver =
      "nvidia"

  }



  if(
    value.includes("amd") ||
    value.includes("amdgpu") ||
    value.includes("radeon")
  ){

    vendor =
      "AMD"


    driver =
      "amdgpu"

  }



  return {

    vendor,

    driver,

  }

}





function normalizeGpuList(
  devices = [],
){

  return devices.map(
    normalizeGpuDevice,
  )

}





export {

  normalizeGpuDevice,

  normalizeGpuList,

}
