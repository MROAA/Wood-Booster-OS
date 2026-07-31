/*
==================================================

SPACEMONKEY ACTIVITY API

Näyttää Spacemonkeyn tapahtumahistorian.

GET:

/api/spacemonkey/activity

==================================================
*/


import express from "express"


import {
  getActivityHistory,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyActivityService.js"







function createSpacemonkeyActivityRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/activity",

    async (

      req,

      res

    )=>{


      try{


        const prisma =
          req.app.locals.prisma





        const activity =
          await getActivityHistory({

            prisma

          })





        res.json({

          success:
            true,


          data:
            activity

        })


      }


      catch(error){


        console.error(

          "SPACEMONKEY ACTIVITY ERROR:",

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

  createSpacemonkeyActivityRouter

}
