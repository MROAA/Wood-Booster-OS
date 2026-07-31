/*
==================================================

SPACEMONKEY SAFETY API ROUTER

Read-only turvallisuusrajapinta.

GET:
 /api/spacemonkey/safety

Ei muuta järjestelmää.

==================================================
*/


import express from "express"


import {
  getSafetyDashboard,
} from "../services/aiBrainV2/system/spacemonkey/dashboard/spacemonkeySafetyDashboardService.js"





function createSpacemonkeySafetyRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/safety",

    async (
      req,
      res
    ) => {


      try {


        const dashboard =
          await getSafetyDashboard()



        res.json({

          success:
            true,

          data:
            dashboard

        })


      }


      catch(error){


        console.error(
          "SPACEMONKEY SAFETY ERROR:",
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

  createSpacemonkeySafetyRouter

}
