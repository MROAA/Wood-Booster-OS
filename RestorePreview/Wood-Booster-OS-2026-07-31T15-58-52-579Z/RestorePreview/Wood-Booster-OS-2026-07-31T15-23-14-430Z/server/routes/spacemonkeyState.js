import express from "express"


import {
  getCurrentState,
  createSystemState,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeySystemStateEngine.js"



function createSpacemonkeyStateRouter(){


  const router =

    express.Router()



  router.get(

    "/state",

    async (

      req,

      res

    ) => {


      try {


        let state =

          getCurrentState()



        if(!state){


          state =

            createSystemState({

              modules:

              [

                {

                  name:

                    "Spacemonkey Core",

                  status:

                    "active"

                },


                {

                  name:

                    "Code Intelligence",

                  status:

                    "active"

                },


                {

                  name:

                    "Development Workflow",

                  status:

                    "active"

                }

              ],

              tasks:[],

              sessions:[],

              workflows:[],

              approvals:[],

              memories:[],

              improvements:[]

            })

        }



        res.json({

          success:true,

          state

        })


      }


      catch(error){


        console.error(error)


        res.status(500).json({

          success:false,

          error:

            error.message

        })


      }


    }

  )



  return router

}



export {

  createSpacemonkeyStateRouter

}
