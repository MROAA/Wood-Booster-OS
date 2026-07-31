/*
=====================================

SPACEMONKEY EVENT INTEGRATION V1

Yhdistää:

Spacemonkey System Kernel
        |
        v
Cognitive Event Bridge
        |
        v
Event Bus


Vastuut:

- aktivoi Event Layer integraation
- tarjoaa tapahtumakerroksen tilan
- toimii Kernel adapterina


Ei:

- tee päätöksiä
- käsittele AI logiikkaa
- kirjoita muistia
- ohita Event Busia

=====================================
*/


import {
  startSpacemonkeyCognitiveEventBridge,
  getSpacemonkeyCognitiveEventBridgeStatus,
} from "./spacemonkeyCognitiveEventBridge.js"



import {
  startSpacemonkeyMemoryBridge,
} from "./spacemonkeyMemoryBridge.js"







let started = false







function startSpacemonkeyEventIntegration(){


  if(started){

    return {

      success:true,

      status:
        "already_started"

    }

  }



  startSpacemonkeyCognitiveEventBridge()



  startSpacemonkeyMemoryBridge()



  started = true



  return {

    success:true,

    status:
      "started"

  }

}







function getSpacemonkeyEventIntegrationStatus(){


  return {

    system:
      "Spacemonkey Event Integration",

    version:
      "1.0.0",

    started,

    cognitiveBridge:

      getSpacemonkeyCognitiveEventBridgeStatus(),


    memoryBridge:
      started,

    status:

      started
        ? "ACTIVE"
        : "READY"

  }

}







export {

  startSpacemonkeyEventIntegration,

  getSpacemonkeyEventIntegrationStatus,

}
