/*
=====================================

SPACEMONKEY RESTORE CHECK API

Ei palauta järjestelmää.

Vain tarkistaa turvallisuustilan.

=====================================
*/


import express from "express"


import {

  checkRestorePermission

} from "../services/spacemonkey/restoreGuard.js"







function createSpacemonkeyRestoreRouter(){


  const router = express.Router()





  router.post(

    "/spacemonkey/restore/check",

    (

      req,

      res

    ) => {


      try {


        const result =

          checkRestorePermission()



        res.json({

          success:

            true,


          restore:

            result

        })


      }


      catch(error){


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

  createSpacemonkeyRestoreRouter

}
