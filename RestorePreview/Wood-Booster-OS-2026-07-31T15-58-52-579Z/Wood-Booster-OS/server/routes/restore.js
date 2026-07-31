import express from "express"

import {
  restoreSnapshot,
} from "../services/restoreService.js"



export default function createRestoreRouter(){


  const router =
    express.Router()



  router.post(
    "/restore",
    async (
      req,
      res
    )=>{


      try{


        const {
          file,
        } =
          req.body



        const result =
          await restoreSnapshot(
            file
          )



        res.json(result)


      }
      catch(error){


        res.status(500).json({

          success:false,

          error:
            error.error ||
            error.message ||
            "Restore failed"

        })


      }


    }
  )



  return router

}
