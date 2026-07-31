/*
=====================================

SPACEMONKEY SERVER INTEGRATION RUNNER V2


Keskitetty Spacemonkey käynnistys.


Yhdistää:

- Core integration
- Runtime Bootstrap
- System Kernel
- Future modules


Ei:

- ei tee AI päätöksiä
- ei kutsu LLM:ää
- ei suorita työkaluja


=====================================
*/


import {
  integrateSpacemonkeySystem,
} from "./spacemonkeySystemIntegration.js"



import {
  startSpacemonkeyRuntimeBootstrap,
} from "./spacemonkeyRuntimeBootstrap.js"







let started = false







export function runSpacemonkeyServerIntegration({
  app,
}) {


  if(started){

    return {

      success:
        true,

      status:
        "already_started",

    }

  }





  console.log(
    "SPACEMONKEY SERVER INTEGRATION START"
  )





  integrateSpacemonkeySystem(
    app
  )





  const bootstrap =

    startSpacemonkeyRuntimeBootstrap()





  started = true





  console.log(
    "SPACEMONKEY SERVER INTEGRATION READY"
  )





  return {

    success:
      true,


    status:
      "ready",


    bootstrap,

  }


}
