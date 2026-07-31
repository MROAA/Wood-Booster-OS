import express from "express"

import {
  restoreSnapshot,
} from "../services/restoreService.js"



export default function createSystemRoutes(){


  const router =
    express.Router()



  router.post(
    "/system/restore",
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
            "System restore failed"

        })


      }


    }
  )



  return router

}
