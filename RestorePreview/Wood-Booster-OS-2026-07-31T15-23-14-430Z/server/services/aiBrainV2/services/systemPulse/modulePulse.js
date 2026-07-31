/*
=====================================

WOOD-BOOSTER AI BRAIN V2

MODULE PULSE

Vastuut:

- lukee AI Brain moduulien tilan
- kertoo aktiiviset moduulit
- tarjoaa moduulien terveystiedon System Pulseen

Ei:
- suorita moduuleja
- muuta rekisteriä
- tee päätöksiä

=====================================
*/


import {
  getRegisteredBrainModules,
} from "../../moduleRegistry.js"





function getModulePulse(){

  const modules =
    getRegisteredBrainModules({
      includeDisabled:
        true,
    })



  const moduleList =
    modules.map(
      (module) => ({

        id:
          module.id,


        name:
          module.name,


        version:
          module.version,


        enabled:
          module.enabled !== false,

      }),
    )



  return {

    total:
      moduleList.length,


    active:
      moduleList.filter(
        (module) =>
          module.enabled,
      ).length,


    modules:
      moduleList,


    checkedAt:
      new Date()
        .toISOString(),

  }

}





export {

  getModulePulse,

}
