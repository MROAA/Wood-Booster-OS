/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SPACEMONKEY CONTEXT INJECTION SERVICE V1


Vastuut:

- vastaanottaa runtime contextin
- rakentaa AI Brain contextin
- tarjoaa valmiin injection objektin


Ei:

- ei kutsu LLM:ää
- ei muuta Brain ydintä
- ei kirjoita muistia


=====================================
*/


import {
  createSpacemonkeyBrainContext,
} from "../context/adapters/spacemonkeyBrainContextAdapter.js"







function buildSpacemonkeyAIContext({

  runtimeContext = {},

} = {}){


  const context =

    createSpacemonkeyBrainContext({

      runtimeContext

    })




  return {


    source:

      "spacemonkey-context-injection-service",



    version:

      "1.0.0",



    context


  }


}







export {

  buildSpacemonkeyAIContext

}
