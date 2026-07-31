/*
=====================================

SPACEMONKEY RUNTIME BOOTSTRAP V1


Vastuut:

- käynnistää Spacemonkey moduulit
- yhdistää integraatiot
- luo System Kernelin
- tarjoaa yhtenäisen käynnistyspisteen


Ei:

- ei tee AI päätöksiä
- ei kutsu LLM:ää
- ei suorita työkaluja
- ei kirjoita muistia


=====================================
*/


import {
  createSpacemonkeySystemKernel,
} from "./spacemonkeySystemKernel.js"



import {
  startSpacemonkeyEventIntegration,
} from "./spacemonkeyEventIntegration.js"



import {
  startSpacemonkeyLearningIntegration,
} from "./spacemonkeyLearningIntegration.js"



import {
  startSpacemonkeyLearningEventBridge,
} from "./spacemonkeyLearningEventBridge.js"







let booted = false


let kernel = null







function startSpacemonkeyRuntimeBootstrap(){


  if(booted){

    return {

      success:
        true,


      status:
        "already_started",


      kernel,

    }

  }





  const eventResult =

    startSpacemonkeyEventIntegration()





  const learningBridgeResult =

    startSpacemonkeyLearningEventBridge()





  const learningResult =

    startSpacemonkeyLearningIntegration()





  kernel =

    createSpacemonkeySystemKernel()





  booted = true





  return {


    success:
      true,


    status:
      "started",


    startup:

      {

        events:
          eventResult,


        learningBridge:
          learningBridgeResult,


        learning:
          learningResult,

      },


    kernel,


  }


}







function getSpacemonkeyBootstrapStatus(){


  return {


    system:

      "Spacemonkey Runtime Bootstrap",



    version:

      "1.0.0",



    booted,



    kernel:

      kernel
        ? "READY"
        : "NOT_STARTED",

  }

}







export {

  startSpacemonkeyRuntimeBootstrap,

  getSpacemonkeyBootstrapStatus,

}
