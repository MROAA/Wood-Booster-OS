/*
=====================================

SPACEMONEY RUNTIME ROUTER

Tarjoaa Runtime Awareness datan
frontendille.

Ei sisällä moduulilogiikkaa.

=====================================
*/


import express from "express"


import {

  getRuntimeState,
  isRuntimeHealthy,

} from "../services/spacemonkey/modules/runtimeAwareness/index.js"







function createSpacemonkeyRuntimeRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/runtime",

    (

      req,

      res

    )=>{


      try{


        const runtime =

          getRuntimeState()



        const health =

          isRuntimeHealthy()





        res.json({

          success:true,

          runtime,

          health,

        })


      }

      catch(error){


        console.error(

          "Spacemonkey runtime error:",

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

  createSpacemonkeyRuntimeRouter

}
