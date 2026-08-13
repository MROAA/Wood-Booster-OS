/*
=====================================
WOOD-BOOSTER AI PLATFORM

SPACEMONKEY COGNITIVE EVENT BRIDGE

Vastuut:
- yhdistää Spacemonkey tapahtumat
- välittää tapahtumat AI Brain V2:lle
- tarjoaa server integraatiopisteen
- ei sisällä päätöksentekoa

=====================================
*/


import {
  emitSpacemonkeyEvent,
  subscribeSpacemonkeyEvent,
} from "./spacemonkeyEventBus.js"





function createCognitiveEventBridge(){

  return {

    emit(
      event,
      payload = {},
    ){

      return emitSpacemonkeyEvent({

        event,

        payload,

      })

    },



    subscribe(
      event,
      handler,
    ){

      return subscribeSpacemonkeyEvent({

        event,

        handler,

      })

    },

  }

}





const spacemonkeyCognitiveEventBridge =
  createCognitiveEventBridge()





let started = false





function startSpacemonkeyCognitiveEventBridge(){

  if(started){

    return {

      success:true,

      status:"already_started",

    }

  }



  started = true



  console.log(
    "🧠 Spacemonkey Cognitive Event Bridge ONLINE"
  )



  return {

    success:true,

    status:"started",

  }

}





function stopSpacemonkeyCognitiveEventBridge(){

  started = false


  return {

    success:true,

    status:"stopped",

  }

}





function getSpacemonkeyCognitiveEventBridgeStatus(){

  return {

    started,

    name:
      "Spacemonkey Cognitive Event Bridge",

  }

}





export {

  createCognitiveEventBridge,

  spacemonkeyCognitiveEventBridge,

  startSpacemonkeyCognitiveEventBridge,

  stopSpacemonkeyCognitiveEventBridge,

  getSpacemonkeyCognitiveEventBridgeStatus,

}
