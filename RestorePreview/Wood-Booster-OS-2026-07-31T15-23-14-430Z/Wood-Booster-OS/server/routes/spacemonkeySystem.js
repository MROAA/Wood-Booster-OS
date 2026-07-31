/*
=====================================

SPACEMONKEY SYSTEM ROUTER

Tarjoaa koko Spacemonkey
järjestelmätilan.

Käyttää vain Snapshot Adapteria.

Read-only.

=====================================
*/


import express from "express"


import {

  getSpacemonkeySystemSnapshot

} from "../services/spacemonkey/spacemonkeySystemSnapshotAdapter.js"







function createSpacemonkeySystemRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/system",

    (

      req,

      res

    )=>{


      try{


        const snapshot =

          getSpacemonkeySystemSnapshot()





        res.json(

          snapshot

        )


      }


      catch(error){


        console.error(

          "Spacemonkey system error:",

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

  createSpacemonkeySystemRouter

}
