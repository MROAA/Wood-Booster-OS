import {
  createUnifiedContext
} from "./spacemonkeyUnifiedContext.js"



const context =
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



console.log(
  "SPACEMONKEY UNIFIED CONTEXT"
)


console.dir(
  context,
  {
    depth:null
  }
)
