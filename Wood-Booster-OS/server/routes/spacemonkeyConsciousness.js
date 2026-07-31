/*
==================================================

SPACEMONKEY CONSCIOUSNESS API

Näyttää Spacemonkeyn aktiivisen ajattelutilan.

GET:

/api/spacemonkey/consciousness

Read-only.

==================================================
*/


import express from "express"


import {
  getSpacemonkeyConsciousness,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyConsciousnessService.js"







function createSpacemonkeyConsciousnessRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/consciousness",

    async (

      req,

      res

    )=>{


      try{


        const prisma =
          req.app.locals.prisma





        const consciousness =
          await getSpacemonkeyConsciousness({

            prisma

          })





        res.json({

          success:
            true,


          data:
            consciousness

        })


      }


      catch(error){


        console.error(

          "SPACEMONKEY CONSCIOUSNESS ERROR:",

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

  createSpacemonkeyConsciousnessRouter

}
