/*
=====================================

SPACEMONKEY KERNEL API ROUTER

Tarjoaa Spacemonkey Kernel tilan.

Mount:
 /api/spacemonkey/kernel

Route:
 /

=====================================
*/


import express from "express"


import {

  getSpacemonkeyKernel

} from "../services/spacemonkey/spacemonkeyKernelAdapter.js"





function createSpacemonkeyKernelApiRouter(){


  const router =
    express.Router()





  router.get(

    "/",

    async (
      req,
      res
    )=>{


      try{


        const kernel =

          await getSpacemonkeyKernel()





        res.json(

          kernel

        )


      }

      catch(error){


        console.error(

          "Spacemonkey kernel API error:",

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

  createSpacemonkeyKernelApiRouter

}
