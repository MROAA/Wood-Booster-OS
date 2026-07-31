import {
  createContextFusion
} from "../context/fusion/contextFusionEngine.js"



const orchestration = {

  results:[

    {

      resolver:
        "identity-resolver",

      knowledge:[

        {
          id:
            "CORE IDENTITY.txt",

          category:
            "identity"

        }

      ]

    },


    {

      resolver:
        "memory-resolver",

      memories:[

        {
          key:
            "wood-booster",

          content:
            "Wood-Booster OS"

        }

      ]

    }

  ]

}



console.dir(

  createContextFusion({

    orchestration

  }),

  {
    depth:null
  }

)
