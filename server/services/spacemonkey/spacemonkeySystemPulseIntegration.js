/*
=====================================

SPACEMONKEY SYSTEM PULSE INTEGRATION

Yhdistää:

Spacemonkey System Kernel
        |
        v
System Pulse Awareness Module
        |
        v
AI Brain V2 System Pulse


Vastuut:

- tarjoaa järjestelmän terveystilan Spacemonkeylle
- toimii read-only adapterina
- välittää System Pulse tiedon


Ei:

- tee päätöksiä
- muuta järjestelmää
- suorita korjauksia

=====================================
*/


import {

  getSystemPulseSummary,

} from "../aiBrainV2/services/systemPulse/systemPulseSummary.js"



import {

  getSystemPulseAwareness,

} from "./modules/systemPulseAwareness/index.js"







async function getSpacemonkeySystemPulseStatus(){


  const pulse =

    await getSystemPulseSummary()





  return {


    system:

      "Spacemonkey System Pulse Integration",



    version:

      "1.0.0",



    status:

      "READY",



    awareness:

      getSystemPulseAwareness(
        pulse
      )


  }


}







export {

  getSpacemonkeySystemPulseStatus

}
