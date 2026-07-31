/*
=====================================

SPACEMONKEY DECISION ROUTER

Tarjoaa Decision Intelligence
datan frontendille.

Ei sisällä päätöslogiikkaa.

=====================================
*/


import express from "express"


import {

  createDecisionReport,
  getDecisionState

} from "../services/spacemonkey/modules/decisionIntelligence/index.js"







function createSpacemonkeyDecisionRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/decision",

    (

      req,

      res

    )=>{


      try{


        const decision =

          createDecisionReport()



        const state =

          getDecisionState()





        res.json({

          success:true,

          decision,

          state,

        })


      }

      catch(error){


        console.error(

          "Spacemonkey decision error:",

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

  createSpacemonkeyDecisionRouter

}
