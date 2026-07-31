import {
  createContextDebugReport
} from "../context/debug/contextDebugReporter.js"



console.dir(

  createContextDebugReport({

    message:

      "Miten kirjoitan Python ohjelman?",


    orchestration:{

      plan:{

        requirements:{

          programming:true

        },


        resolvers:[

          "programming"

        ]

      }

    },


    fusion:{

      knowledge:[

        {

          id:

          "PYTHON MASTER ENGINE.txt"

        }

      ],


      memories:[],


      projects:[]

    }


  }),

  {
    depth:null
  }

)
