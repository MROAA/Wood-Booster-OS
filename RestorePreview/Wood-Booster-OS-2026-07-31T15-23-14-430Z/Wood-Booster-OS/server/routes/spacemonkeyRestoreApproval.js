/*
=====================================

SPACEMONKEY RESTORE APPROVAL API

Hallinnoi snapshot-palautuksen
hyväksyntää.

Ei suorita palautusta.

=====================================
*/


import express from "express"


import {

  requestRestoreApproval,

  getRestoreApproval

} from "../services/spacemonkey/restoreApproval.js"







function createSpacemonkeyRestoreApprovalRouter(){


  const router = express.Router()






  router.post(

    "/spacemonkey/restore/approve",

    (

      req,

      res

    ) => {


      try {


        const approvedBy =

          req.body?.approvedBy ||

          "unknown"





        const approval =

          requestRestoreApproval({

            approvedBy

          })





        res.json({

          success:

            true,


          approval

        })


      }


      catch(error){


        res.status(500).json({

          success:

            false,


          error:

            error.message

        })


      }


    }

  )







  router.get(

    "/spacemonkey/restore/status",

    (

      req,

      res

    ) => {


      try {


        const approval =

          getRestoreApproval()





        res.json({

          success:

            true,


          approval

        })


      }


      catch(error){


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

  createSpacemonkeyRestoreApprovalRouter

}
