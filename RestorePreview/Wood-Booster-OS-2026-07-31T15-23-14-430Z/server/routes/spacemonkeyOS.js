/*
=====================================

SPACEMONKEY OS ROUTER

Mount:
 /api/spacemonkey/os

Route:
 /

=====================================
*/


import express from "express"


import {

  getSpacemonkeyOS

} from "../services/spacemonkey/spacemonkeyMasterKernelAdapter.js"





function createSpacemonkeyOSRouter(){


  const router =
    express.Router()





  router.get(

    "/",

    (req,res)=>{


      try{


        res.json(

          getSpacemonkeyOS()

        )


      }


      catch(error){


        console.error(

          "Spacemonkey OS error:",

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

  createSpacemonkeyOSRouter

}
