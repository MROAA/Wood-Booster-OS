/*
=====================================

SPACEMONKEY API GATEWAY

Yhdistää Spacemonkey API:t.

Read-only gateway.

=====================================
*/


import express from "express"


import {

  getSpacemonkeySystemSnapshot

} from "../services/spacemonkey/spacemonkeySystemSnapshotAdapter.js"







function createSpacemonkeyGatewayRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/system",

    (

      req,

      res

    )=>{


      try{


        res.json(

          getSpacemonkeySystemSnapshot()

        )


      }


      catch(error){


        console.error(

          "Spacemonkey gateway error:",

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

  createSpacemonkeyGatewayRouter

}
