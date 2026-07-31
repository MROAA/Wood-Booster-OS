/*
=====================================

SPACEMONKEY RESTORE DRY RUN API

Valmistelee palautuksen.

Ei suorita palautusta.

=====================================
*/


import express from "express"


import {

  createRestorePlan

} from "../services/spacemonkey/restoreController.js"







function createSpacemonkeyRestoreDryRunRouter(){


  const router = express.Router()





  router.post(

    "/spacemonkey/restore/dry-run",

    (

      req,

      res

    ) => {


      try {


        const plan =

          createRestorePlan()





        res.json({

          success:

            true,


          restore:

            plan

        })


      }


      catch(error){


        console.error(

          "Restore dry run error:",

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

  createSpacemonkeyRestoreDryRunRouter

}
