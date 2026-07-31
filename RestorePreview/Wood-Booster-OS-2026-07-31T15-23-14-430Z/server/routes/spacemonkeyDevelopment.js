import express from "express"


import {
  runDevelopmentFlow,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyDevelopmentOrchestrator.js"



function createSpacemonkeyDevelopmentRouter(){


  const router =

    express.Router()



  router.post(

    "/development",

    async (

      req,

      res

    ) => {


      try {


        const {

          message,

          codingContext,

          codeChangePlan,

          codeInspection,

          approval

        } = req.body



        const result =

          runDevelopmentFlow({

            message,

            codingContext,

            codeChangePlan,

            codeInspection,

            approval

          })



        res.json({

          success:true,

          result

        })


      }


      catch(error){


        console.error(

          error

        )


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

  createSpacemonkeyDevelopmentRouter

}
