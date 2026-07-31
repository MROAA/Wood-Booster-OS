/*
=====================================

SPACEMONKEY COMMAND CENTER ROUTER

Tarjoaa Spacemonkey
Command Center näkymän.

Read-only.

=====================================
*/


import express from "express"


import {

  getSpacemonkeyCommandCenter

} from "../services/spacemonkey/spacemonkeyCommandCenter.js"







function createSpacemonkeyCommandCenterRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/dashboard",

    (

      req,

      res

    )=>{


      try{


        res.json(

          getSpacemonkeyCommandCenter()

        )


      }


      catch(error){


        console.error(

          "Spacemonkey command center error:",

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

  createSpacemonkeyCommandCenterRouter

}
