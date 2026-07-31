import {
  createAIBrainContextInjection
} from "../context/adapters/aiBrainContextInjectionAdapter.js"



const fusionContext = {

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
        "Marc created Wood-Booster"

    }

  ],


  projects:[

    {

      name:
        "Wood-Booster OS"

    }

  ]

}



console.dir(

  createAIBrainContextInjection({

    fusionContext

  }),

  {
    depth:null
  }

)
