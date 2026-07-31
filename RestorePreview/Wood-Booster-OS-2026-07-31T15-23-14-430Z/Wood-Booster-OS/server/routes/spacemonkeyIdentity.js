/*
==================================================

SPACEMONKEY IDENTITY API

Read-only identity interface.

GET:
 /api/spacemonkey/identity

Lähde:
Spacemonkey Root Database

==================================================
*/


import express from "express"


import {
  getSpacemonkeyGenesisIdentity,
} from "../services/aiBrainV2/system/spacemonkey/identity/spacemonkeyGenesisIdentityService.js"







function createSpacemonkeyIdentityRouter(){


  const router =
    express.Router()






  router.get(

    "/spacemonkey/identity",

    async (
      req,
      res
    )=>{


      try{


        const identity =
          await getSpacemonkeyGenesisIdentity()



        res.json({

          success:
            true,

          data:
            identity

        })


      }


      catch(error){


        console.error(
          "SPACEMONKEY IDENTITY ERROR:",
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

  createSpacemonkeyIdentityRouter

}
