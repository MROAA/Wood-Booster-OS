/*
=====================================

SPACEMONEY REFLECTION ROUTER

Tarjoaa Reflection Intelligence
datan frontendille.

Ei sisällä moduulilogiikkaa.

=====================================
*/


import express from "express"


import {

  createReflectionReport,
  getReflectionState

} from "../services/spacemonkey/modules/reflectionIntelligence/index.js"







function createSpacemonkeyReflectionRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/reflection",

    (

      req,

      res

    )=>{


      try{


        const reflection =

          createReflectionReport()



        const state =

          getReflectionState()





        res.json({

          success:true,

          reflection,

          state,

        })


      }

      catch(error){


        console.error(

          "Spacemonkey reflection error:",

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

  createSpacemonkeyReflectionRouter

}
