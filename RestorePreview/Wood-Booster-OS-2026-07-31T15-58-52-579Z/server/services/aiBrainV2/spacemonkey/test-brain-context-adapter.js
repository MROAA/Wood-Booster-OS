import {
  createUnifiedContext
} from "./spacemonkeyUnifiedContext.js"


import {
  createBrainContextFromSpacemonkey
} from "./spacemonkeyBrainContextAdapter.js"



const unifiedContext =
  createUnifiedContext({

    message:
      "Mikä on Spacemonkeyn persoonallisuus?",


    runtimeContext:{

      identity:
        "Spacemonkey AI Operator",


      personality:{

        friendly:true,

        patient:true

      },


      responseStyle:{

        clear:true

      },


      kernel:{

        version:"V1"

      }

    }

  })



const brainContext =
  createBrainContextFromSpacemonkey(
    unifiedContext
  )



console.log(
  "BRAIN CONTEXT ADAPTER RESULT"
)


console.dir(
  brainContext,
  {
    depth:null
  }
)
