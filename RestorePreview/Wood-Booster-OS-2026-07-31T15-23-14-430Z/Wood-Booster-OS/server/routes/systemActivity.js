import express from "express"

import {
  getSystemActivity,
} from "../services/systemActivityService.js"



export default function createSystemActivityRouter(){


  const router =
    express.Router()



  router.get(
    "/system/activity",
    async (
      req,
      res
    )=>{


      try{


        const events =
          await getSystemActivity()



        res.json({

          success:true,

          events,

        })


      }
      catch(error){


        res.status(500).json({

          success:false,

          error:
            error.message ||
            "Could not read system activity"

        })


      }


    }
  )



  return router

}
