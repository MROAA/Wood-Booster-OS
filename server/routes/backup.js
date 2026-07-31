import express from "express"

import {
  createSnapshot
} from "../services/backupService.js"



export default function createBackupRouter(){

  const router =
    express.Router()



  router.post(
    "/backup",
    async (
      req,
      res
    )=>{


      try{


        const result =
          await createSnapshot()



        res.json(result)


      }
      catch(error){


        res.status(500).json({

          success:false,

          error:
            error.error ||
            error.message ||
            "Backup failed"

        })


      }


    }
  )



  return router

}
