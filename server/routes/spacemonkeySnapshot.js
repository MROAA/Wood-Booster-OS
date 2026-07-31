/*
=====================================

SPACEMONKEY CORE SNAPSHOT API

Tarjoaa uuden turvallisen
snapshot näkymän.

Read-only.

=====================================
*/


import express from "express"


import {

  buildSpacemonkeySnapshot

} from "../services/spacemonkey/snapshotAdapter.js"





function createSpacemonkeySnapshotRouter(){


  const router = express.Router()





  router.get(

    "/spacemonkey/core-snapshot",

    (

      req,

      res

    )=>{


      try{


        const snapshot =

          buildSpacemonkeySnapshot()



        res.json({

          success:

            true,


          snapshot

        })


      }


      catch(error){


        console.error(
          "Snapshot API error:",
          error
        )


        res.status(500).json({

          success:

            false,


          error:

            error.message

        })


      }


    }

  )





  return router


}







export {

  createSpacemonkeySnapshotRouter

}
