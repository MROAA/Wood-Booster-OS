/*
=====================================

SPACEMONKEY EXECUTION ROUTER

Tarjoaa Execution Intelligence
datan frontendille.

Ei sisällä suorituslogiikkaa.

=====================================
*/


import express from "express"


import {

  createExecutionReport,
  getExecutionState

} from "../services/spacemonkey/modules/executionIntelligence/index.js"







function createSpacemonkeyExecutionRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/execution",

    (

      req,

      res

    )=>{


      try{


        const execution =

          createExecutionReport()



        const state =

          getExecutionState()





        res.json({

          success:true,

          execution,

          state,

        })


      }


      catch(error){


        console.error(

          "Spacemonkey execution error:",

          error

        )


        res.status(500).json({

          success:false,

          error:error.message

        })


      }


    }

  )







  return router


}







export {

  createSpacemonkeyExecutionRouter

}
