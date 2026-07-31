import {
  createSpacemonkeyBrainContext
} from "../context/adapters/spacemonkeyBrainContextAdapter.js"



const runtimeContext = {

  spacemonkey:{

    kernel:
      "10.0.0"

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


    memories:[

      {

        key:
          "creator",

        content:
          "Marc"

      }

    ]

  }

}



console.dir(

  createSpacemonkeyBrainContext({

    runtimeContext

  }),

  {
    depth:null
  }

)
