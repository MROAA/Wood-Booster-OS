import {
  getSpacemonkeyIdentity,
} from "./spacemonkeyIdentity.js"


import {
  getPersonalityRules,
} from "./spacemonkeyPersonalityEngine.js"


import {
  runCognitiveCycle,
} from "./spacemonkeyCognitiveCycle.js"


import {
  processCognitiveEvents,
} from "./spacemonkeyCognitiveEventAdapter.js"


import {
  selectResponseStrategy,
} from "./spacemonkeyResponseStrategy.js"


import {
  generateResponse,
} from "./spacemonkeyResponseGenerator.js"


import {
  loadGodFiles,
} from "./spacemonkeyGodFileLoader.js"


import {
  getCoreAPIStatus,
} from "../../../../../Spacemonkey/core/spacemonkeyCoreAPI.js"


import {
  startSpacemonkey,
} from "../../../../../Spacemonkey/core/spacemonkeyBootSequence.js"





const facadeHistory = []



const SPACEMONKEY_STATUS = {

  READY:
    "ready",

  ERROR:
    "error"

}







async function process({

  message,

  prisma

}) {


  try {


    const coreStatus =
      getCoreAPIStatus()



    const core =
      startSpacemonkey()





    const runtime =
      coreStatus.runtime





    const modules =
      coreStatus.runtime.modules.active.map(

        id =>

        ({

          id,

          name:
            id,

          enabled:
            true

        })

      )





    const identity =
      getSpacemonkeyIdentity()



    const personality =
      getPersonalityRules()



    const godFiles =
      loadGodFiles()





    const cognitiveCycle =

      await runCognitiveCycle({

        message,

        prisma

      })



console.log(
  "SPACEMONKEY COGNITIVE CYCLE",
  {
    decision: cognitiveCycle.decision,
    plan: cognitiveCycle.plan
  }
)
    const memoryProposal =

message
        ?

        {

          category:
            "spacemonkey",


          key:
            `spacemonkey_memory_${Date.now()}`,


          content:
            message,


          importance:
            8

        }

        :

        null



    const memoryProposalCreated =

      Boolean(
        memoryProposal
      )
    const cognitiveEvents =

      await processCognitiveEvents({

        prisma,

        decision:

          cognitiveCycle.decision,


        plan:

          cognitiveCycle.plan

      })





    const strategy =

      selectResponseStrategy({

        mode:

          cognitiveCycle.intent?.intent === "CODING_REQUEST"

            ?

            "coding"

            :

            "general"

      })





    const response =

      generateResponse({

        message,

        strategy,

        userProfile:

          cognitiveCycle.userProfile,

        plan:

          cognitiveCycle.plan,

        codePipeline:

          cognitiveCycle.codePipeline

      })







    const result = {


      success:

        true,


      core,


      coreStatus,


      runtime,


      modules,


      agent:

        identity.name,


      version:

        identity.version,


      identity:

      {

        purpose:

          identity.purpose,


        origin:

          identity.origin

      },


      personality,


      godFiles,


      cognitiveEvents,


            response,


      memoryProposalCreated,


      memoryProposal,


      cognitiveCycle,

      createdAt:

        new Date().toISOString()

    }





    facadeHistory.push(

      result

    )





    return result


  }


  catch(error){


    return {


      success:

        false,


      status:

        SPACEMONKEY_STATUS.ERROR,


      error:

        error.message

    }

  }

}







function getFacadeHistory(){

  return [

    ...facadeHistory

  ]

}







function getFacadeStatus(){


  return {


    engine:

      "Spacemonkey Brain Facade",


    version:

      "0.9.0",


    status:

      SPACEMONKEY_STATUS.READY,


    requests:

      facadeHistory.length

  }

}







export {

  process,

  getFacadeHistory,

  getFacadeStatus

}
