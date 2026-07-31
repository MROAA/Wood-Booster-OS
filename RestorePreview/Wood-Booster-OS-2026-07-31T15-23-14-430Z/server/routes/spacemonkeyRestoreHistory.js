/*
=====================================

SPACEMONKEY RESTORE HISTORY API

Näyttää palautustapahtumien historian.

Read-only.

=====================================
*/


import express from "express"



import {

  getRestoreAuditLog

} from "../services/spacemonkey/restoreAudit.js"







function createSpacemonkeyRestoreHistoryRouter(){


  const router = express.Router()






  router.get(

    "/spacemonkey/restore/history",

    (

      req,

      res

    ) => {


      try {


        const history =

          getRestoreAuditLog()





        res.json({

          success:

            true,


          history

        })


      }


      catch(error){


        console.error(

          "Restore history error:",

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

  createSpacemonkeyRestoreHistoryRouter

}
