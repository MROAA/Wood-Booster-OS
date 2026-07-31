/*
==================================================

SPACEMONKEY CORE API

Yhdistetty Spacemonkey ydintila.

GET:
 /api/spacemonkey/core

Read-only.

==================================================
*/


import express from "express"


import {
  getSpacemonkeyCoreStatus,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyCoreStatusService.js"







function createSpacemonkeyCoreRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/core",

    async (
      req,
      res
    )=>{


      try{


        const prisma =
          req.app.locals.prisma





const core =
  await getSpacemonkeyCoreStatus({

    prisma

  })


console.log(
  "SPACEMONKEY CORE DEBUG:",
  JSON.stringify(core,null,2)
)


        res.json({

          success:
            true,

          data:
            core

        })


      }


      catch(error){


        console.error(
          "SPACEMONKEY CORE ERROR:",
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

  createSpacemonkeyCoreRouter

}	
