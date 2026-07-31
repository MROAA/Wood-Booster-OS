/*
=====================================

SPACEMONKEY SNAPSHOT V3 API ROUTER

Tarjoaa Spacemonkey
System Snapshot v3 näkymän.

Read-only.

=====================================
*/


import express from "express"


import {

  getSpacemonkeySnapshotV3

} from "../services/spacemonkey/spacemonkeySnapshotAdapterV3.js"







function createSpacemonkeySnapshotV3ApiRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/snapshot-v3",

    (

      req,

      res

    )=>{


      try{


        res.json(

          getSpacemonkeySnapshotV3()

        )


      }


      catch(error){


        console.error(

          "Spacemonkey snapshot v3 error:",

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

  createSpacemonkeySnapshotV3ApiRouter

}
