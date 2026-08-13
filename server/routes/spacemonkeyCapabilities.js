/*
=====================================

SPACEMONEY CAPABILITY ROUTER

Tarjoaa Capability Health datan
frontendille.

Ei sisällä moduulilogiikkaa.

=====================================
*/


import express from "express"


import {

  createCapabilityHealthReport

} from "../services/spacemonkey/modules/capabilityHealthCheck/index.js"







function createSpacemonkeyCapabilitiesRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/capabilities",

    (

      req,

      res

    )=>{


      try{


        const capabilities =

          createCapabilityHealthReport()





        res.json({

          success:true,

          capabilities,

        })


      }

      catch(error){


        console.error(

          "Spacemonkey capabilities error:",

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

  createSpacemonkeyCapabilitiesRouter

}
