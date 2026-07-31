/*
=====================================

SPACEMONKEY RUNTIME ADAPTER V1

Yhdistää:

Spacemonkey Runtime
        |
        v
AI Brain V2 Runtime Context


Vastuut:

- lisää Spacemonkey Runtime tiedot
- pitää integraation erillään AI Brainista
- tarjoaa turvallisen rajapinnan


Ei:

- ei tee päätöksiä
- ei kutsu AI-mallia
- ei kirjoita muistia
- ei hae internetistä

=====================================
*/


import {
  createSpacemonkeyRuntime,
} from "./spacemonkeyRuntime.js"







function injectSpacemonkeyRuntime({

  runtimeContext = {},

  personality = null,

  knowledge = [],

  memory = [],

  security = null,

  system = null,

} = {}) {



  const spacemonkeyRuntime =

    createSpacemonkeyRuntime({

      personality,

      knowledge,

      memory,

      security,

      system,

    })





  return {

    ...runtimeContext,


    spacemonkeyRuntime,


    spacemonkeyRuntimeLoaded:

      true,


    spacemonkeyCapabilities:

      spacemonkeyRuntime.capabilities,


    spacemonkeyModules:

      spacemonkeyRuntime.modules

  }


}







function getSpacemonkeyRuntime(

  runtimeContext = {}

){


  return (

    runtimeContext.spacemonkeyRuntime ||

    null

  )


}







export {

  injectSpacemonkeyRuntime,

  getSpacemonkeyRuntime,

}
