import express from "express"

import {
  getSnapshotRegistry,
} from "../services/snapshotRegistryService.js"



export default function createBackupsRouter(){


  const router =
    express.Router()



  router.get(
    "/backups",
    async (
      req,
      res
    )=>{


      try{


        const snapshots =
          await getSnapshotRegistry()



        res.json({

          success:true,

          snapshots,

        })


      }
      catch(error){


        res.status(500).json({

          success:false,

          error:
            error.message ||
            "Could not read snapshot registry"

        })


      }


    }
  )



  return router

}
