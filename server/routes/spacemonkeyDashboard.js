/*
=====================================

SPACEMONKEY DASHBOARD ROUTER

Tarjoaa Spacemonkey
Command Center näkymän.

Frontend päätepiste.

Read-only.

=====================================
*/


import express from "express"


import {

  getSpacemonkeyDashboard

} from "../services/spacemonkey/spacemonkeyCommandCenterAdapter.js"







function createSpacemonkeyDashboardRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/dashboard",

    async (

      req,

      res

    )=>{


      try{


        const dashboard =

          await getSpacemonkeyDashboard()





        res.json(

          dashboard

        )


      }


      catch(error){


        console.error(

          "Spacemonkey dashboard error:",

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

  createSpacemonkeyDashboardRouter

}
