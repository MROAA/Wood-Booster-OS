import {
  executeContextOrchestration
} from "../context/orchestrator/contextOrchestrator.js"



console.dir(

  executeContextOrchestration({

    message:
      "Mikä on Spacemonkeyn persoonallisuus?",


    knowledge:[

      {
        id:
          "CORE IDENTITY.txt",

        category:
          "identity",

        content:
          "Spacemonkey identity"

      },


      {
        id:
          "PYTHON MASTER ENGINE.txt",

        category:
          "programming",

        content:
          "Python"

      }

    ]

  }),

  {
    depth:null
  }

)
