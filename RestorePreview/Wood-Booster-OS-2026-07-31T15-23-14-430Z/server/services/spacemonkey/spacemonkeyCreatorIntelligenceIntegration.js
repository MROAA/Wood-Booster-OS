/*
=====================================

SPACEMONKEY CREATOR INTELLIGENCE
INTEGRATION V1


Yhdistää:

Spacemonkey Kernel
        |
        v
Creator Intelligence Runtime
        |
        v
Creator Intelligence Registry


Vastuut:

- tarjoaa Creator Intelligence tilan
- käynnistää runtime-kerroksen
- näyttää aktiiviset moduulit
- tarjoaa turvallisen rajapinnan


Ei:

- tee päätöksiä
- kirjoita muistia
- muuta creator-moduuleita
- ohita security layeria

=====================================
*/


import {
  initializeCreatorRuntime,
  createCreatorIntelligenceContext,
  getRuntimeStatus,
} from "./modules/creatorIntelligenceRuntime/index.js"



import {
  getRegistry,
  getActiveModules,
} from "./modules/creatorIntelligenceRegistry/index.js"







let initialized = false







function startCreatorIntelligenceIntegration(){


  if(initialized){

    return {

      success:true,

      status:
        "already_started",

    }

  }



  const registry =
    getRegistry()



  const result =
    initializeCreatorRuntime({

      modules:
        registry.modules,

    })



  initialized = true



  return {

    success:true,

    status:
      "started",

    runtime:
      result,

  }

}







function getSpacemonkeyCreatorIntelligenceStatus(){

  return {

    system:
      "Spacemonkey Creator Intelligence Integration",

    version:
      "1.0.0",

    status:
      initialized
        ? "ACTIVE"
        : "READY",


    runtime:

      getRuntimeStatus(),


    context:

      createCreatorIntelligenceContext(),


    registry:

      getRegistry(),


    activeModules:

      getActiveModules(),

  }

}







export {

  startCreatorIntelligenceIntegration,

  getSpacemonkeyCreatorIntelligenceStatus,

}
