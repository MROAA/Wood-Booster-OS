/*
=====================================

SPACEMONKEY KERNEL ROUTER

Yhdistää Spacemonkey
järjestelmän hallintatilan.

Read-only.

Ei muuta järjestelmää.

=====================================
*/


import express from "express"


import {

  getGatewayStatus

} from "../services/spacemonkey/spacemonkeyGatewayManager.js"







function createSpacemonkeyKernelRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/kernel",

    (

      req,

      res

    )=>{


      try{


        res.json(

          getGatewayStatus()

        )


      }


      catch(error){


        console.error(

          "Spacemonkey kernel error:",

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

  createSpacemonkeyKernelRouter

}
