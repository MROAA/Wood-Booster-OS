import {
  buildSpacemonkeyAIContext
} from "./spacemonkeyContextInjectionService.js"



const runtimeContext = {


  spacemonkey:{

    kernel:
      "10.0.0"

  },


  spacemonkeyPersonality:{

    enabled:
      true

  },


  spacemonkeyContextFusion:{


    resolvers:[

      "identity-resolver"

    ],


    knowledge:[

      {

        id:
          "CORE IDENTITY.txt",

        content:
          "Spacemonkey identity"

      }

    ],


    memories:[],


    projects:[]


  }


}



console.dir(

  buildSpacemonkeyAIContext({

    runtimeContext

  }),

  {
    depth:null
  }

)
