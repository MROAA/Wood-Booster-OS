/*
=====================================

SPACEMONKEY WORLD MODEL ROUTER

Tarjoaa World Model Intelligence
datan frontendille.

Ei sisällä mallin muodostuslogiikkaa.

=====================================
*/


import express from "express"


import {

  createWorldModelReport,
  getWorldModelState

} from "../services/spacemonkey/modules/worldModelIntelligence/index.js"







function createSpacemonkeyWorldModelRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/world-model",

    (

      req,

      res

    )=>{


      try{


        const worldModel =

          createWorldModelReport()



        const state =

          getWorldModelState()





        res.json({

          success:true,

          worldModel,

          state,

        })


      }


      catch(error){


        console.error(

          "Spacemonkey world model error:",

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

  createSpacemonkeyWorldModelRouter

}
