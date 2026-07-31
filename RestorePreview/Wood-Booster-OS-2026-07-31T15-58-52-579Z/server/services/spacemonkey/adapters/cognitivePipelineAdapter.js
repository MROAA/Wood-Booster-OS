/*
=====================================

SPACEMONKEY COGNITIVE PIPELINE ADAPTER

MVP INTEGRATION LAYER

Vastuut:

- yhdistää vanhat route-moduulit
- kutsuu AI Brain V2 pipelinea
- pitää rajapinnan vakaana
- ei sisällä päätöksiä

Ei:

- ei omaa muistia
- ei omaa tietokantaa
- ei ohita Brain Runtimea

=====================================
*/


import {
  runSpacemonkeyCognitivePipeline,
} from "../../aiBrainV2/personality/spacemonkeyCognitivePipeline.js"





async function runSpacemonkeyPipeline({

  prisma,

  message = "",

  memory = [],

  knowledge = [],

  systemState = {},

} = {}) {


  const runtimeContext = {


    prisma,


    memory,


    knowledge,


    systemState,


    source:
      "spacemonkey-cognitive-router"

  }





  const result =
    await runSpacemonkeyCognitivePipeline({

      message,

      runtimeContext,

    })





  return {

    success:
      true,


    source:
      "cognitivePipelineAdapter",


    result,

  }


}





export {

  runSpacemonkeyPipeline,

}
