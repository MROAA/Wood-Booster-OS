/*
=====================================

SPACEMONKEY LEARNING ROUTER

Tarjoaa Learning Intelligence
datan frontendille.

Ei sisällä oppimislogiikkaa.

=====================================
*/


import express from "express"


import {

  createLearningReport,
  getLearningState

} from "../services/spacemonkey/modules/learningIntelligence/index.js"







function createSpacemonkeyLearningRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/learning",

    (

      req,

      res

    )=>{


      try{


        const learning =

          createLearningReport()



        const state =

          getLearningState()





        res.json({

          success:true,

          learning,

          state,

        })


      }


      catch(error){


        console.error(

          "Spacemonkey learning error:",

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

  createSpacemonkeyLearningRouter

}
